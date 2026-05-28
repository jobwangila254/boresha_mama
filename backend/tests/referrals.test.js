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
const { AppError } = require('../src/middleware/errorHandler');
const logger = require('../src/config/logger');
const {
  createReferral,
  getReferrals,
  updateReferralStatus,
} = require('../src/controllers/referralController');

describe('Referral Controller', () => {
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

  describe('createReferral', () => {
    it('should create a referral and return 201', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        toFacilityId: 'fac-2',
        referralReason: 'High blood pressure',
        priority: 'urgent',
        notes: 'BP 160/100',
      };

      query
        .mockResolvedValueOnce({ rows: [{ facility_id: 'fac-1' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'ref-1',
            pregnancy_id: 'preg-1',
            from_facility_id: 'fac-1',
            to_facility_id: 'fac-2',
            priority: 'urgent',
          }],
        });

      await createReferral(req, res, next);

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[0][0]).toContain('SELECT facility_id FROM chv_profiles');
      expect(query.mock.calls[1][0]).toContain('INSERT INTO referrals');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Referral created')
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ref-1' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should default priority to normal when not provided', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        toFacilityId: 'fac-2',
        referralReason: 'Checkup',
        notes: '',
      };

      query
        .mockResolvedValueOnce({ rows: [{ facility_id: 'fac-1' }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'ref-2', priority: 'normal' }],
        });

      await createReferral(req, res, next);

      expect(query.mock.calls[1][1]).toContain('normal');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getReferrals', () => {
    it('should return referrals list for CHV role', async () => {
      req.user = { id: 'chv-1', role: 'chv' };
      const fakeRows = [
        {
          id: 'ref-1',
          referred_by: 'John CHV',
          mother_name: 'Jane Doe',
          from_facility: 'Dispensary A',
          to_facility: 'Hospital B',
        },
      ];
      query.mockResolvedValue({ rows: fakeRows });

      await getReferrals(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.from_chv_id'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith(fakeRows);
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter by status query param', async () => {
      req.user = { id: 'staff-1', role: 'facility_staff' };
      req.query = { status: 'pending' };

      query.mockResolvedValue({ rows: [] });

      await getReferrals(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.status'),
        expect.arrayContaining(['pending'])
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('updateReferralStatus', () => {
    it('should update referral status and return 200', async () => {
      req.params = { id: 'ref-1' };
      req.body = { status: 'completed', outcome: 'Patient treated' };

      const fakeRow = { id: 'ref-1', status: 'completed', outcome: 'Patient treated' };
      query.mockResolvedValue({ rows: [fakeRow] });

      await updateReferralStatus(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE referrals'),
        ['completed', 'Patient treated', req.user.id, 'ref-1']
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Referral ref-1 updated to completed')
      );
      expect(res.json).toHaveBeenCalledWith(fakeRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw AppError when referral not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { status: 'completed', outcome: 'N/A' };

      query.mockResolvedValue({ rows: [] });

      await updateReferralStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Referral not found');
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
