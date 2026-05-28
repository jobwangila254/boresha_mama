const db = require('../config/database');

exports.getHealthTips = async (req, res, next) => {
  try {
    const { trimester, category } = req.query;
    let query = 'SELECT * FROM health_tips WHERE is_active = true';
    const params = [];
    let idx = 1;

    if (trimester) {
      query += ` AND trimester = $${idx++}`;
      params.push(parseInt(trimester));
    }
    if (category) {
      query += ` AND category = $${idx++}`;
      params.push(category);
    }

    query += ' ORDER BY week_start ASC NULLS LAST';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};
