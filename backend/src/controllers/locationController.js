const db = require('../config/database');

exports.getLocations = async (req, res, next) => {
  try {
    const { county, mode, sub_location, ward } = req.query;
    let query = 'SELECT * FROM locations WHERE is_active = true';
    const params = [];
    let paramIndex = 1;

    if (county) {
      query += ` AND county = $${paramIndex++}`;
      params.push(county);
    }

    if (mode === 'villages') {
      if (sub_location) {
        query += ` AND sub_location = $${paramIndex++}`;
        params.push(sub_location);
      }
      if (ward) {
        query += ` AND ward = $${paramIndex++}`;
        params.push(ward);
      }
      query += ' ORDER BY village ASC';
      const result = await db.query(query, params);
      return res.json(result.rows.map(r => ({ id: r.id, village: r.village, ward: r.ward, sub_location: r.sub_location })));
    }

    if (mode === 'sub_locations') {
      query += ' ORDER BY sub_location ASC';
      const result = await db.query(query, params);
      const distinct = [...new Map(result.rows.map(r => [r.sub_location, { sub_location: r.sub_location, ward: r.ward }])).values()];
      return res.json(distinct);
    }

    query += ' ORDER BY constituency ASC, ward ASC, sub_location ASC, village ASC';
    const result = await db.query(query, params);

    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.constituency]) {
        grouped[row.constituency] = {};
      }
      if (!grouped[row.constituency][row.ward]) {
        grouped[row.constituency][row.ward] = { sub_locations: new Set(), villages: [] };
      }
      if (row.sub_location) {
        grouped[row.constituency][row.ward].sub_locations.add(row.sub_location);
      }
      grouped[row.constituency][row.ward].villages.push(row.village);
    }

    const formatted = Object.entries(grouped).map(([constituency, wards]) => ({
      constituency,
      wards: Object.entries(wards).map(([ward, data]) => ({
        ward,
        sub_locations: [...data.sub_locations],
        villages: data.villages,
      })),
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};
