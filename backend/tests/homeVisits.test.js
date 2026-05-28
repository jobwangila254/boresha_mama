jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { query } = require('../src/config/database');
const logger = require('../src/config/logger');
const {
  createHomeVisit,
  getHomeVisits,
  syncOfflineVisits,
} = require('../src/controllers/homeVisitController');

describe('Home Visit Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'chv-1', role: 'chv' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('createHomeVisit', () => {
    it('should create a home visit and return 201', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        visitDate: '2026-06-01',
        visitType: 'routine',
        weightKg: 65,
        bpSystolic: 120,
        bpDiastolic: 80,
        temperatureC: 36.5,
        pulseRate: 72,
        hemoglobin: 12.5,
        fundalHeightCm: 28,
        fetalHeartRate: 140,
        dangerSigns: [],
        notes: 'All good',
      };

      const fakeRow = { id: 'visit-1', risk_level: 'low' };
      query.mockResolvedValue({ rows: [fakeRow] });

      await createHomeVisit(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO home_visits'),
        expect.arrayContaining([req.body.pregnancyId, req.body.motherId, req.user.id])
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Home visit recorded')
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update pregnancy risk level when danger signs present', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        visitDate: '2026-06-01',
        visitType: 'routine',
        bpSystolic: 120,
        bpDiastolic: 80,
        dangerSigns: ['severe_headache'],
        notes: '',
      };

      query.mockResolvedValue({ rows: [{ id: 'visit-1', risk_level: 'high' }] });

      await createHomeVisit(req, res, next);

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[1][0]).toContain('UPDATE pregnancies');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should call next with error on DB failure', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        visitDate: '2026-06-01',
        visitType: 'routine',
        dangerSigns: [],
      };

      const error = new Error('Database error');
      query.mockRejectedValue(error);

      await createHomeVisit(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getHomeVisits', () => {
    it('should return home visits list for a CHV role', async () => {
      req.user = { id: 'chv-1', role: 'chv' };
      const fakeRows = [
        { id: 'visit-1', visit_date: '2026-06-01', chv_name: 'Jane CHV' },
      ];
      query.mockResolvedValue({ rows: fakeRows });

      await getHomeVisits(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('hv.chv_id'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith(fakeRows);
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter by pregnancyId query param', async () => {
      req.user = { id: 'mother-user-1', role: 'mother' };
      req.query = { pregnancyId: 'preg-1' };

      query.mockResolvedValue({ rows: [] });

      await getHomeVisits(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('hv.pregnancy_id'),
        expect.arrayContaining(['preg-1'])
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('syncOfflineVisits', () => {
    it('should sync valid visits array and return summary', async () => {
      req.body = {
        visits: [
          {
            pregnancyId: 'preg-1',
            motherId: 'mother-1',
            visitDate: '2026-06-01',
            visitType: 'routine',
            bpSystolic: 120,
            bpDiastolic: 80,
            dangerSigns: [],
          },
          {
            pregnancyId: 'preg-2',
            motherId: 'mother-2',
            visitDate: '2026-06-02',
            visitType: 'followup',
            bpSystolic: 130,
            bpDiastolic: 85,
            dangerSigns: [],
          },
        ],
      };

      query.mockResolvedValue({ rows: [{ id: 'visit-1' }] });

      await syncOfflineVisits(req, res, next);

      expect(query).toHaveBeenCalledTimes(4); // 2 visits * (1 insert + 1 sync_log)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('2 visits synced')
      );
      expect(res.json).toHaveBeenCalledWith({
        synced: 2,
        failed: 0,
        results: [
          { id: 'visit-1', status: 'synced' },
          { id: 'visit-1', status: 'synced' },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when visits is not an array', async () => {
      req.body = { visits: 'not-an-array' };

      await syncOfflineVisits(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'visits must be an array' });
      expect(query).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when visits is missing', async () => {
      req.body = {};

      await syncOfflineVisits(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'visits must be an array' });
      expect(query).not.toHaveBeenCalled();
    });
  });
});
