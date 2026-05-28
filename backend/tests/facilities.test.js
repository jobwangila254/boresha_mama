jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

const { query } = require('../src/config/database');
const {
  getFacilities,
  getFacilityById,
  getNearbyFacilities,
} = require('../src/controllers/facilityController');

describe('Facility Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getFacilities', () => {
    it('should return facilities when data exists', async () => {
      const rows = [{ id: 1, name: 'Test Facility' }];
      query.mockResolvedValue({ rows });

      await getFacilities(req, res, next);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM facilities WHERE is_active = true ORDER BY name ASC',
        []
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('should call next on database error', async () => {
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getFacilities(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getFacilityById', () => {
    it('should return facility when found', async () => {
      const row = { id: 1, name: 'Test Facility' };
      req.params.id = '1';
      query.mockResolvedValue({ rows: [row] });

      await getFacilityById(req, res, next);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM facilities WHERE id = $1',
        ['1']
      );
      expect(res.json).toHaveBeenCalledWith(row);
    });

    it('should return 404 when facility not found', async () => {
      req.params.id = '999';
      query.mockResolvedValue({ rows: [] });

      await getFacilityById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Facility not found' });
    });

    it('should call next on database error', async () => {
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getFacilityById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getNearbyFacilities', () => {
    it('should return nearby facilities with lat/lng params', async () => {
      req.query = { lat: '-1.2921', lng: '36.8219' };
      const rows = [{ id: 1, name: 'Nearby Facility', distance_km: 2.5 }];
      query.mockResolvedValue({ rows });

      await getNearbyFacilities(req, res, next);

      expect(query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('should return 400 when lat and lng are missing', async () => {
      req.query = {};

      await getNearbyFacilities(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Latitude and longitude required' });
    });

    it('should call next on database error', async () => {
      req.query = { lat: '-1.2921', lng: '36.8219' };
      const error = new Error('DB error');
      query.mockRejectedValue(error);

      await getNearbyFacilities(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
