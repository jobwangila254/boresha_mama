jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
  pool: { end: jest.fn() },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { query } = require('../src/config/database');
const { AppError } = require('../src/middleware/errorHandler');
const {
  recordSelfMonitoring,
  getSelfMonitoring,
} = require('../src/controllers/monitoringController');

describe('Monitoring Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'mother-user-1', role: 'mother' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('recordSelfMonitoring', () => {
    it('should record self monitoring and return 201', async () => {
      const motherRow = { id: 'mother-uuid' };
      const monitoringRow = {
        id: 'mon-1',
        mother_id: 'mother-uuid',
        pregnancy_id: 'preg-1',
        weight_kg: 70,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        danger_alert_triggered: false,
      };

      query
        .mockResolvedValueOnce({ rows: [motherRow] })
        .mockResolvedValueOnce({ rows: [monitoringRow] });

      req.body = {
        pregnancyId: 'preg-1',
        weightKg: 70,
        bpSystolic: 120,
        bpDiastolic: 80,
        bloodSugar: 5.5,
        symptoms: [],
        fetalMovements: 10,
        notes: 'Feeling well',
      };

      await recordSelfMonitoring(req, res, next);

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[0][0]).toContain('SELECT id FROM mothers');
      expect(query.mock.calls[1][0]).toContain('INSERT INTO self_monitoring');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(monitoringRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should trigger danger alert when BP is dangerously high', async () => {
      const motherRow = { id: 'mother-uuid' };
      const monitoringRow = {
        id: 'mon-2',
        mother_id: 'mother-uuid',
        danger_alert_triggered: true,
      };

      query
        .mockResolvedValueOnce({ rows: [motherRow] })
        .mockResolvedValueOnce({ rows: [monitoringRow] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'mother-user-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      req.body = {
        pregnancyId: 'preg-1',
        weightKg: 70,
        bpSystolic: 160,
        bpDiastolic: 110,
        bloodSugar: 5.5,
        symptoms: [],
        fetalMovements: 10,
        notes: '',
      };

      await recordSelfMonitoring(req, res, next);

      expect(query).toHaveBeenCalledTimes(4);
      expect(query.mock.calls[3][0]).toContain('INSERT INTO notifications');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should throw AppError when mother profile not found', async () => {
      query.mockResolvedValue({ rows: [] });

      req.body = {
        pregnancyId: 'preg-1',
        weightKg: 70,
        bpSystolic: 120,
        bpDiastolic: 80,
      };

      await recordSelfMonitoring(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Mother profile not found');
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getSelfMonitoring', () => {
    it('should return monitoring records for a mother role', async () => {
      req.user = { id: 'mother-user-1', role: 'mother' };
      const fakeRows = [
        { id: 'mon-1', recorded_at: '2026-01-01T10:00:00Z', weight_kg: 70 },
        { id: 'mon-2', recorded_at: '2026-01-15T10:00:00Z', weight_kg: 71 },
      ];
      query.mockResolvedValue({ rows: fakeRows });

      await getSelfMonitoring(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('m.user_id'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith(fakeRows);
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter by pregnancyId query param', async () => {
      req.user = { id: 'chv-1', role: 'chv' };
      req.query = { pregnancyId: 'preg-1' };

      query.mockResolvedValue({ rows: [] });

      await getSelfMonitoring(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('sm.pregnancy_id'),
        expect.arrayContaining(['preg-1'])
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
