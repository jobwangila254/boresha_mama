const db = require('../config/database');

exports.getFacilities = async (req, res, next) => {
  try {
    const { ward, constituency, type } = req.query;
    let query = 'SELECT * FROM facilities WHERE is_active = true';
    const params = [];
    let paramIndex = 1;

    if (ward) {
      query += ` AND ward = $${paramIndex++}`;
      params.push(ward);
    }
    if (constituency) {
      query += ` AND constituency = $${paramIndex++}`;
      params.push(constituency);
    }
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    query += ' ORDER BY name ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getNearbyFacilities = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const result = await db.query(
      `SELECT * FROM (
        SELECT *, (
          6371 * acos(cos(radians($1)) * cos(radians(latitude))
          * cos(radians($2) - radians(longitude))
          + sin(radians($1)) * sin(radians(latitude)))
        ) AS distance_km
        FROM facilities
        WHERE is_active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
      ) sub
      WHERE distance_km < $3
      ORDER BY distance_km ASC`,
      [lat, lng, radius]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getFacilityById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM facilities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
