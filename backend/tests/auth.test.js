const request = require('supertest');
const app = require('../src/index');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

const adminToken = jwt.sign(
  { id: 'test-admin-id', role: 'county_admin' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

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
});
