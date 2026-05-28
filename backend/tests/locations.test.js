jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

const { query } = require('../src/config/database');
const { getLocations } = require('../src/controllers/locationController');

describe('Location Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getLocations', () => {
    it('should return grouped locations by constituency and ward', async () => {
      const rows = [
        { constituency: 'Const A', ward: 'Ward 1', village: 'Village 1' },
        { constituency: 'Const A', ward: 'Ward 1', village: 'Village 2' },
        { constituency: 'Const A', ward: 'Ward 2', village: 'Village 3' },
      ];
      query.mockResolvedValue({ rows });

      await getLocations(req, res, next);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM locations WHERE is_active = true ORDER BY constituency ASC, ward ASC, village ASC',
        []
      );
      expect(res.json).toHaveBeenCalledWith([
        {
          constituency: 'Const A',
          wards: [
            { ward: 'Ward 1', villages: ['Village 1', 'Village 2'] },
            { ward: 'Ward 2', villages: ['Village 3'] },
          ],
        },
      ]);
    });

    it('should call next on database error', async () => {
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getLocations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
