const db = require('../config/database');
const logger = require('../config/logger');

exports.createHomeVisit = async (req, res, next) => {
  try {
    const {
      pregnancyId, motherId, visitDate, visitType,
      weightKg, bpSystolic, bpDiastolic, temperatureC,
      pulseRate, hemoglobin, fundalHeightCm, fetalHeartRate,
      dangerSigns, notes,
    } = req.body;

    const result = await db.query(
      `INSERT INTO home_visits (pregnancy_id, mother_id, chv_id, visit_date, visit_type,
        weight_kg, blood_pressure_systolic, blood_pressure_diastolic, temperature_c,
        pulse_rate, hemoglobin, fundal_height_cm, fetal_heart_rate,
        danger_signs, notes, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [pregnancyId, motherId, req.user.id, visitDate, visitType,
       weightKg, bpSystolic, bpDiastolic, temperatureC,
       pulseRate, hemoglobin, fundalHeightCm, fetalHeartRate,
       dangerSigns || [], notes,
       determineRiskLevel(bpSystolic, bpDiastolic, dangerSigns)]
    );

    // Update pregnancy risk level if needed
    if (dangerSigns && dangerSigns.length > 0) {
      await db.query(
        'UPDATE pregnancies SET risk_level = $1, updated_at = NOW() WHERE id = $2 AND risk_level != $1',
        ['high', pregnancyId]
      );
    }

    logger.info(`Home visit recorded: ${result.rows[0].id} for pregnancy ${pregnancyId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getHomeVisits = async (req, res, next) => {
  try {
    let query = `
      SELECT hv.*, u.first_name || ' ' || u.last_name as chv_name
      FROM home_visits hv
      JOIN users u ON hv.chv_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (req.user.role === 'chv') {
      conditions.push('hv.chv_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'mother') {
      conditions.push('hv.mother_id = (SELECT id FROM mothers WHERE user_id = $1)');
      params.push(req.user.id);
    }

    if (req.query.pregnancyId) {
      conditions.push(`hv.pregnancy_id = $${params.length + 1}`);
      params.push(req.query.pregnancyId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY hv.visit_date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.syncOfflineVisits = async (req, res, next) => {
  try {
    const { visits } = req.body;
    if (!Array.isArray(visits)) {
      return res.status(400).json({ error: 'visits must be an array' });
    }
    const results = [];

    for (const visit of visits) {
      try {
        const riskLevel = determineRiskLevel(visit.bpSystolic, visit.bpDiastolic, visit.dangerSigns);
        const result = await db.query(
          `INSERT INTO home_visits (pregnancy_id, mother_id, chv_id, visit_date, visit_type,
            weight_kg, blood_pressure_systolic, blood_pressure_diastolic, temperature_c,
            pulse_rate, hemoglobin, fundal_height_cm, fetal_heart_rate,
            danger_signs, notes, risk_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING id`,
          [visit.pregnancyId, visit.motherId, req.user.id, visit.visitDate, visit.visitType,
           visit.weightKg, visit.bpSystolic, visit.bpDiastolic, visit.temperatureC,
           visit.pulseRate, visit.hemoglobin, visit.fundalHeightCm, visit.fetalHeartRate,
           visit.dangerSigns || [], visit.notes, riskLevel]
        );

        await db.query(
          `INSERT INTO sync_log (user_id, table_name, record_id, action, payload)
           VALUES ($1, 'home_visits', $2, 'create', $3)`,
          [req.user.id, result.rows[0].id, JSON.stringify(visit)]
        );

        results.push({ id: result.rows[0].id, status: 'synced' });
      } catch (err) {
        results.push({ status: 'failed', error: err.message });
      }
    }

    logger.info(`Sync: ${results.filter(r => r.status === 'synced').length} visits synced for CHV ${req.user.id}`);
    res.json({ synced: results.filter(r => r.status === 'synced').length, failed: results.filter(r => r.status === 'failed').length, results });
  } catch (err) {
    next(err);
  }
};

function determineRiskLevel(bpSystolic, bpDiastolic, dangerSigns) {
  if (dangerSigns && dangerSigns.length > 0) return 'high';
  if (bpSystolic >= 140 || bpDiastolic >= 90) return 'high';
  if (bpSystolic >= 130 || bpDiastolic >= 85) return 'medium';
  return 'low';
}
