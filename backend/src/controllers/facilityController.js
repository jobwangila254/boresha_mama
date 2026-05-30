const db = require('../config/database');

exports.getFacilities = async (req, res, next) => {
  try {
    const { ward, constituency, type, include_inactive } = req.query;
    let query = 'SELECT * FROM facilities WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (!include_inactive) {
      query += ' AND is_active = true';
    }
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

exports.createFacility = async (req, res, next) => {
  try {
    const { name, type, ward, constituency, level, phone, email, latitude, longitude } = req.body;

    if (!name || !type || !ward || !constituency || !level) {
      return res.status(400).json({ error: 'Name, type, ward, constituency, and level are required' });
    }

    const result = await db.query(
      `INSERT INTO facilities (name, type, ward, constituency, level, phone, email, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [name, type, ward, constituency, level, phone || null, email || null, latitude || null, longitude || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getFacilityStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facility = await db.query('SELECT * FROM facilities WHERE id = $1', [id]);
    if (facility.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const staffCount = await db.query(
      'SELECT COUNT(*) FROM facility_staff WHERE facility_id = $1', [id]
    );

    const pregnancyCount = await db.query(
      'SELECT COUNT(*) FROM pregnancies WHERE facility_id = $1', [id]
    );

    const activePregnancies = await db.query(
      "SELECT COUNT(*) FROM pregnancies WHERE facility_id = $1 AND status = 'active'", [id]
    );

    const referralsTo = await db.query(
      'SELECT COUNT(*) FROM referrals WHERE to_facility_id = $1', [id]
    );

    const referralsFrom = await db.query(
      'SELECT COUNT(*) FROM referrals WHERE from_facility_id = $1', [id]
    );

    const referralsCompleted = await db.query(
      "SELECT COUNT(*) FROM referrals WHERE to_facility_id = $1 AND status = 'completed'", [id]
    );

    const appointmentsTotal = await db.query(
      'SELECT COUNT(*) FROM appointments WHERE facility_id = $1', [id]
    );

    const appointmentsUpcoming = await db.query(
      "SELECT COUNT(*) FROM appointments WHERE facility_id = $1 AND appointment_date >= NOW() AND status = 'scheduled'", [id]
    );

    const mothers = await db.query(
      `SELECT COUNT(DISTINCT m.id) FROM mothers m
       JOIN pregnancies p ON p.mother_id = m.id
       WHERE p.facility_id = $1`, [id]
    );

    res.json({
      facility: facility.rows[0],
      stats: {
        staffCount: parseInt(staffCount.rows[0].count),
        pregnancyCount: parseInt(pregnancyCount.rows[0].count),
        activePregnancies: parseInt(activePregnancies.rows[0].count),
        referralsTo: parseInt(referralsTo.rows[0].count),
        referralsFrom: parseInt(referralsFrom.rows[0].count),
        referralsCompleted: parseInt(referralsCompleted.rows[0].count),
        appointmentsTotal: parseInt(appointmentsTotal.rows[0].count),
        appointmentsUpcoming: parseInt(appointmentsUpcoming.rows[0].count),
        mothersCount: parseInt(mothers.rows[0].count),
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateFacility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, ward, constituency, level, phone, email, latitude, longitude, is_active } = req.body;

    const result = await db.query(
      `UPDATE facilities
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           ward = COALESCE($3, ward),
           constituency = COALESCE($4, constituency),
           level = COALESCE($5, level),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           latitude = COALESCE($8, latitude),
           longitude = COALESCE($9, longitude),
           is_active = COALESCE($10, is_active),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [name, type, ward, constituency, level, phone, email, latitude, longitude, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
