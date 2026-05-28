const db = require('../config/database');

exports.getLocations = async (req, res, next) => {
  try {
    const { county } = req.query;
    let query = 'SELECT * FROM locations WHERE is_active = true';
    const params = [];
    let paramIndex = 1;

    if (county) {
      query += ` AND county = $${paramIndex++}`;
      params.push(county);
    }

    query += ' ORDER BY constituency ASC, ward ASC, village ASC';
    const result = await db.query(query, params);

    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.constituency]) {
        grouped[row.constituency] = {};
      }
      if (!grouped[row.constituency][row.ward]) {
        grouped[row.constituency][row.ward] = [];
      }
      grouped[row.constituency][row.ward].push(row.village);
    }

    const formatted = Object.entries(grouped).map(([constituency, wards]) => ({
      constituency,
      wards: Object.entries(wards).map(([ward, villages]) => ({
        ward,
        villages,
      })),
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};
