const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

exports.registerPregnancy = async (req, res, next) => {
  try {
    const {
      motherId, lmpDate, gravida, parity,
      riskFactors, notes, facilityId,
    } = req.body;

    const eddDate = calculateEDD(lmpDate);

    const result = await db.query(
      `INSERT INTO pregnancies (mother_id, registered_by, facility_id, lmp_date, edd_date, gravida, parity, risk_factors, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [motherId, req.user.id, facilityId, lmpDate, eddDate, gravida || 1, parity || 0, riskFactors || [], notes]
    );

    // Auto-calculate risk level
    const pregnancy = result.rows[0];
    const riskLevel = calculateRiskLevel(pregnancy, riskFactors);
    await db.query(
      'UPDATE pregnancies SET risk_level = $1 WHERE id = $2',
      [riskLevel, pregnancy.id]
    );

    pregnancy.risk_level = riskLevel;

    logger.info(`Pregnancy registered: ${pregnancy.id} for mother ${motherId}`);
    res.status(201).json(pregnancy);
  } catch (err) {
    next(err);
  }
};

exports.getPregnancies = async (req, res, next) => {
  try {
    let query = `
      SELECT p.*, u.first_name || ' ' || u.last_name as mother_name,
             f.name as facility_name,
             u.phone as mother_phone, u.national_id as mother_national_id, m.date_of_birth as mother_dob,
             m.ward, m.village, m.constituency, m.sub_location, m.alternate_phone,
             cu.first_name as chv_first_name, cu.last_name as chv_last_name, cu.phone as chv_phone
      FROM pregnancies p
      JOIN mothers m ON p.mother_id = m.id
      JOIN users u ON m.user_id = u.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN users cu ON m.chv_id = cu.id
    `;
    const params = [];
    const conditions = [];

    // Role-based filtering
    if (req.user.role === 'mother') {
      conditions.push('m.user_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'chv') {
      conditions.push('(m.chv_id = $1 OR p.registered_by = $1)');
      params.push(req.user.id);
    } else if (req.user.role === 'facility_staff') {
      conditions.push('p.facility_id = (SELECT facility_id FROM facility_staff WHERE user_id = $1)');
      params.push(req.user.id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getPregnancyById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.first_name || ' ' || u.last_name as mother_name,
              f.name as facility_name, u.phone as mother_phone,
              m.ward, m.village, m.constituency, m.sub_location, m.alternate_phone,
              u2.first_name || ' ' || u2.last_name as registered_by_name
       FROM pregnancies p
       JOIN mothers m ON p.mother_id = m.id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN facilities f ON p.facility_id = f.id
       LEFT JOIN users u2 ON p.registered_by = u2.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Pregnancy not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updatePregnancy = async (req, res, next) => {
  try {
    const { status, riskLevel, riskFactors, notes, facilityId } = req.body;
    const result = await db.query(
      `UPDATE pregnancies SET
        status = COALESCE($1, status),
        risk_level = COALESCE($2, risk_level),
        risk_factors = COALESCE($3, risk_factors),
        facility_id = COALESCE($4, facility_id),
        notes = COALESCE($5, notes),
        updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [status, riskLevel, riskFactors, facilityId, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Pregnancy not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getPregnancyTimeline = async (req, res, next) => {
  try {
    const pregnancyId = req.params.id;

    const [pregnancyResult, appointments, visits, selfMonitoring, allTips] = await Promise.all([
      db.query('SELECT * FROM pregnancies WHERE id = $1', [pregnancyId]),
      db.query('SELECT * FROM appointments WHERE pregnancy_id = $1 ORDER BY appointment_date', [pregnancyId]),
      db.query('SELECT * FROM home_visits WHERE pregnancy_id = $1 ORDER BY visit_date', [pregnancyId]),
      db.query('SELECT * FROM self_monitoring WHERE pregnancy_id = $1 ORDER BY recorded_at', [pregnancyId]),
      db.query(
        'SELECT * FROM health_tips WHERE is_active = true ORDER BY week_start ASC NULLS LAST',
        []
      ),
    ]);

    if (pregnancyResult.rows.length === 0) {
      throw new AppError('Pregnancy not found', 404);
    }

    const p = pregnancyResult.rows[0];
    const currentWeek = calculateGestationalWeek(p.lmp_date);

    const tips = allTips.rows.filter(tip =>
      (!tip.trimester || tip.trimester === currentWeek.trimester) &&
      (!tip.week_start || (currentWeek.week >= tip.week_start && currentWeek.week <= tip.week_end))
    );

    res.json({
      pregnancy: p,
      currentWeek: currentWeek.week,
      currentTrimester: currentWeek.trimester,
      weeksRemaining: currentWeek.weeksRemaining,
      appointments: appointments.rows,
      homeVisits: visits.rows,
      selfMonitoring: selfMonitoring.rows,
      healthTips: tips,
    });
  } catch (err) {
    next(err);
  }
};

function calculateEDD(lmpDate) {
  const lmp = new Date(lmpDate);
  const edd = new Date(lmp);
  edd.setDate(edd.getDate() + 280);
  return edd.toISOString().split('T')[0];
}

function calculateGestationalWeek(lmpDate) {
  const lmp = new Date(lmpDate);
  const now = new Date();
  const diffMs = now - lmp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = diffDays / 7;
  const week = Math.min(Math.max(Math.floor(totalWeeks), 0), 42);
  const trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3;
  const weeksRemaining = Math.max(40 - week, 0);
  return { week, trimester, weeksRemaining };
}

function calculateRiskLevel(pregnancy, riskFactors) {
  const highRiskFactors = ['previous_miscarriage', 'hypertension', 'diabetes', 'multiple_pregnancy', 'age_over_35', 'age_under_18', 'previous_c_section', 'hiv_positive', 'anemia_severe'];
  const mediumRiskFactors = ['anemia', 'previous_complication', 'obesity', 'short_stature'];

  const hasHigh = riskFactors?.some(f => highRiskFactors.includes(f));
  const hasMedium = riskFactors?.some(f => mediumRiskFactors.includes(f));

  if (hasHigh) return 'high';
  if (hasMedium) return 'medium';
  return 'low';
}

module.exports = { ...exports, calculateEDD, calculateGestationalWeek, calculateRiskLevel };
