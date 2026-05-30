const { authenticate, authorize } = require('../src/middleware/auth');

function mockReqRes() {
  const req = { headers: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('should reject requests without Authorization header', async () => {
      const { req, res, next } = mockReqRes();
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with non-Bearer Authorization', async () => {
      const { req, res, next } = mockReqRes();
      req.headers.authorization = 'Basic someToken';
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject requests without token after Bearer', async () => {
      const { req, res, next } = mockReqRes();
      req.headers.authorization = 'Bearer ';
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorize', () => {
    it('should allow requests for matching role', () => {
      const { req, res, next } = mockReqRes();
      req.user = { id: '1', role: 'county_admin' };
      const middleware = authorize('county_admin');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should reject requests for non-matching role', () => {
      const { req, res, next } = mockReqRes();
      req.user = { id: '1', role: 'chv' };
      const middleware = authorize('county_admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions.' });
    });

    it('should reject requests when user is not set', () => {
      const { req, res, next } = mockReqRes();
      const middleware = authorize('county_admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

describe('Pregnancy Calculations', () => {
  const { calculateEDD, calculateGestationalWeek, calculateRiskLevel } = require('../src/controllers/pregnancyController');

  describe('calculateEDD', () => {
    it('should calculate EDD as 280 days from LMP', () => {
      expect(calculateEDD('2026-01-01')).toBe('2026-10-08');
    });

    it('should handle leap year LMP', () => {
      const edd = calculateEDD('2024-02-01');
      expect(edd).toBe('2024-11-07');
    });
  });

  describe('calculateGestationalWeek', () => {
    it('should return week 0 for today LMP', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = calculateGestationalWeek(today);
      expect(result.week).toBe(0);
      expect(result.trimester).toBe(1);
    });

    it('should return correct trimester for first trimester', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = calculateGestationalWeek(thirtyDaysAgo);
      expect(result.trimester).toBe(1);
    });

    it('should return trimester 2 for week 14', () => {
      const lmp = new Date(Date.now() - 98 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = calculateGestationalWeek(lmp);
      expect(result.trimester).toBe(2);
    });

    it('should return trimester 3 for week 28+', () => {
      const lmp = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = calculateGestationalWeek(lmp);
      expect(result.trimester).toBe(3);
    });
  });

  describe('calculateRiskLevel', () => {
    it('should return high risk for previous miscarriage', () => {
      expect(calculateRiskLevel({}, ['previous_miscarriage'])).toBe('high');
    });

    it('should return medium risk for anemia', () => {
      expect(calculateRiskLevel({}, ['anemia'])).toBe('medium');
    });

    it('should return low risk for no risk factors', () => {
      expect(calculateRiskLevel({}, [])).toBe('low');
    });

    it('should prioritize high risk over medium', () => {
      expect(calculateRiskLevel({}, ['anemia', 'hypertension'])).toBe('high');
    });
  });
});
