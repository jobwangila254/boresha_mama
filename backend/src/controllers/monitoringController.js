const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const smsService = require('../services/smsService');

exports.recordSelfMonitoring = async (req, res, next) => {
  try {
    const {
      pregnancyId, weightKg, bpSystolic, bpDiastolic,
      bloodSugar, symptoms, fetalMovements, notes,
    } = req.body;

    const motherResult = await db.query(
      'SELECT id FROM mothers WHERE user_id = $1',
      [req.user.id]
    );
    if (motherResult.rows.length === 0) {
      throw new AppError('Mother profile not found', 404);
    }
    const motherId = motherResult.rows[0].id;

    const dangerAlertTriggered = checkDangerSignals(bpSystolic, bpDiastolic, symptoms);

    const result = await db.query(
      `INSERT INTO self_monitoring (mother_id, pregnancy_id, weight_kg,
        blood_pressure_systolic, blood_pressure_diastolic, blood_sugar,
        symptoms, fetal_movements, notes, danger_alert_triggered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [motherId, pregnancyId, weightKg, bpSystolic, bpDiastolic,
       bloodSugar, symptoms || [], fetalMovements, notes, dangerAlertTriggered]
    );

    if (dangerAlertTriggered) {
      await createDangerAlert(pregnancyId, motherId, result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getSelfMonitoring = async (req, res, next) => {
  try {
    let query = `
      SELECT sm.*
      FROM self_monitoring sm
      JOIN mothers m ON sm.mother_id = m.id
    `;
    const params = [];
    const conditions = [];

    if (req.user.role === 'mother') {
      conditions.push('m.user_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'chv') {
      conditions.push('m.chv_id = $1');
      params.push(req.user.id);
    }

    if (req.query.pregnancyId) {
      conditions.push(`sm.pregnancy_id = $${params.length + 1}`);
      params.push(req.query.pregnancyId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sm.recorded_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

function checkDangerSignals(bpSystolic, bpDiastolic, symptoms) {
  if (bpSystolic >= 160 || bpDiastolic >= 110) return true;
  if (symptoms && symptoms.length > 0) {
    const dangerSymptoms = ['severe_headache', 'blurred_vision', 'vaginal_bleeding', 'severe_abdominal_pain', 'convulsions', 'loss_of_consciousness'];
    return symptoms.some(s => dangerSymptoms.includes(s));
  }
  return false;
}

async function createDangerAlert(pregnancyId, motherId, _monitoringRecord) {
  try {
    const alertMessage = 'Danger signs detected. Please contact your CHV or visit the nearest health facility immediately.';

    // Get mother's user ID and phone
    const motherResult = await db.query(
      'SELECT m.user_id, u.phone FROM mothers m JOIN users u ON m.user_id = u.id WHERE m.id = $1',
      [motherId]
    );
    if (motherResult.rows.length > 0) {
      const { user_id: userId, phone } = motherResult.rows[0];
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, channel)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'Danger Sign Alert!', alertMessage, 'alert', 'both']
      );

      smsService.sendSms(phone, `Boresha-Mama: ${alertMessage}`).catch(err => {
        logger.error('Danger alert SMS failed:', err.message);
      });

      // Also notify mother's CHV if assigned
      const chvResult = await db.query(
        `SELECT u.phone FROM mothers m JOIN users u ON m.chv_id = u.id WHERE m.id = $1 AND m.chv_id IS NOT NULL`,
        [motherId]
      );
      if (chvResult.rows.length > 0) {
        smsService.sendSms(chvResult.rows[0].phone, `Boresha-Mama: A mother under your care has reported danger signs. Please follow up urgently.`).catch(err => {
          logger.error('CHV danger alert SMS failed:', err.message);
        });
      }
    }
  } catch (err) {
      logger.error('Failed to create danger alert:', err);
  }
}
