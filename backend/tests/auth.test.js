const request = require('supertest');
const app = require('../src/index');
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const { v4: uuidv4 } = require('uuid');

// Use default timeout; bcrypt rounds are reduced in test env via config

let adminToken;
const TEST_USER = {
  phone: '+254700000099',
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'county_admin',
};

beforeAll(async () => {
  const id = uuidv4();
  await db.query(
    `INSERT INTO users (id, phone, national_id, first_name, last_name, password_hash, role, is_verified, is_active)
     VALUES ($1, $2, '99999999', $3, $4, $5, $6, true, true)
     ON CONFLICT (phone) DO UPDATE SET first_name = $3, last_name = $4 RETURNING id`,
    [id, TEST_USER.phone, TEST_USER.firstName, TEST_USER.lastName, await bcrypt.hash(TEST_USER.password, config.bcrypt.rounds), TEST_USER.role]
  );
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: TEST_USER.phone, password: TEST_USER.password });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await db.query('DELETE FROM users WHERE phone = $1', [TEST_USER.phone]);
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '123', password: 'test123', firstName: 'Test', lastName: 'User', role: 'mother' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+254712345678' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: '+254700000000', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('Boresha-Mama API');
    });
  });

  describe('GET /api/pregnancies with stale token', () => {
    it('should reject token for deleted user', async () => {
      const jwt = require('jsonwebtoken');
      const config = require('../src/config');
      const staleToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', role: 'county_admin' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      const res = await request(app)
        .get('/api/pregnancies')
        .set('Authorization', `Bearer ${staleToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User no longer exists.');
    });
  });
});
