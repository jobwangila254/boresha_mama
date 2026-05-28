jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

const { query } = require('../src/config/database');
const {
  getDashboardStats,
  getKPIData,
  exportReport,
} = require('../src/controllers/reportController');

describe('Report Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return stats for county_admin role', async () => {
      req.user = { role: 'county_admin' };

      const statsRow = {
        total_mothers: 100,
        active_pregnancies: 80,
        medium_risk_pregnancies: 5,
        high_risk_pregnancies: 10,
        enrolled_mothers: 70,
      };
      query
        .mockResolvedValueOnce({ rows: [statsRow] })
        .mockResolvedValueOnce({ rows: [{ total: 5 }] })
        .mockResolvedValueOnce({ rows: [{ total: 20 }] })
        .mockResolvedValueOnce({ rows: [{ total: 15, pending: 3 }] })
        .mockResolvedValueOnce({ rows: [{ total: 8 }] })
        .mockResolvedValueOnce({ rows: [{ month: '2026-01', count: 10 }] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      await getDashboardStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        totalMothers: 100,
        activePregnancies: 80,
        mediumRiskPregnancies: 5,
        highRiskPregnancies: 10,
        totalFacilities: 5,
        totalCHVs: 20,
        totalReferrals: 15,
        pendingReferrals: 3,
        totalDeliveries: 0,
        ancCoverage: 70.0,
        weekAppointments: 8,
        monthlyDeliveries: [{ month: '2026-01', count: 10 }],
        wardStats: [],
      });
    });

    it('should call next on database error', async () => {
      req.user = { role: 'county_admin' };
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getDashboardStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getKPIData', () => {
    it('should return KPI data with default monthly period', async () => {
      const rows = [
        { period: '2026-01-01', pregnancies: 10, home_visits: 5, referrals: 3, high_risk: 2 },
      ];
      query.mockResolvedValue({ rows });

      await getKPIData(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_TRUNC($1, p.created_at)'),
        ['month', undefined, undefined]
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('should call next on database error', async () => {
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getKPIData(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('exportReport', () => {
    it('should return JSON data for pregnancies report', async () => {
      req.user = { role: 'county_admin' };
      req.query = { type: 'pregnancies', format: 'json' };
      const rows = [{ mother_name: 'Jane Doe' }];
      query.mockResolvedValue({ rows });

      await exportReport(req, res, next);

      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('should return CSV for pregnancies report', async () => {
      req.user = { role: 'county_admin' };
      req.query = { type: 'pregnancies', format: 'csv' };
      const rows = [{
        mother_id_no: '12345678',
        mother_name: 'Jane Doe',
        mother_phone: '+254700000000',
        location: 'Village, Ward, Const',
        registered_by: 'Admin User',
        facility_name: 'Test Facility',
        lmp_date: '2025-01-01',
        edd_date: '2025-10-01',
        gravida: 2,
        parity: 1,
        status: 'active',
        risk_level: 'low',
        created_at: '2025-01-15',
      }];
      query.mockResolvedValue({ rows });

      await exportReport(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=pregnancies_report.csv'
      );
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 for CSV with no data', async () => {
      req.user = { role: 'county_admin' };
      req.query = { type: 'pregnancies', format: 'csv' };
      query.mockResolvedValue({ rows: [] });

      await exportReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No data found' });
    });

    it('should return 400 for invalid report type', async () => {
      req.query = { type: 'invalid' };

      await exportReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid report type' });
    });

    it('should call next on database error', async () => {
      req.user = { role: 'county_admin' };
      req.query = { type: 'pregnancies' };
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await exportReport(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
