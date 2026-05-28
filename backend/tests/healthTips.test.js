jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

const { query } = require('../src/config/database');
const { getHealthTips } = require('../src/controllers/healthTipController');

describe('Health Tip Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getHealthTips', () => {
    it('should return health tips sorted by week_start', async () => {
      const rows = [
        { id: 1, title: 'First Trimester Tips', trimester: 1, week_start: 1 },
        { id: 2, title: 'Second Trimester Tips', trimester: 2, week_start: 13 },
      ];
      query.mockResolvedValue({ rows });

      await getHealthTips(req, res, next);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM health_tips WHERE is_active = true ORDER BY week_start ASC NULLS LAST',
        []
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('should filter by trimester when query param provided', async () => {
      req.query.trimester = '2';
      query.mockResolvedValue({ rows: [] });

      await getHealthTips(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('trimester = $1'),
        [2]
      );
    });

    it('should call next on database error', async () => {
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getHealthTips(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
