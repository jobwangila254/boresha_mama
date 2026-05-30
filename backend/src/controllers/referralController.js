const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const smsService = require('../services/smsService');

exports.createReferral = async (req, res, next) => {
  try {
    const { pregnancyId, motherId, toFacilityId, referralReason, priority, notes } = req.body;

    const chvProfile = await db.query('SELECT facility_id FROM chv_profiles WHERE user_id = $1', [req.user.id]);
    const fromFacilityId = chvProfile.rows[0]?.facility_id || null;

    const result = await db.query(
      `INSERT INTO referrals (pregnancy_id, mother_id, from_chv_id, from_facility_id, to_facility_id, referral_reason, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [pregnancyId, motherId, req.user.id, fromFacilityId, toFacilityId, referralReason, priority || 'normal', notes]
    );

    const referral = result.rows[0];
    logger.info(`Referral created: ${referral.id} to facility ${toFacilityId}`);

    const motherInfo = await db.query(
      `SELECT u.phone, u.first_name, f.name as facility_name
       FROM mothers m
       JOIN users u ON m.user_id = u.id
       JOIN facilities f ON f.id = $1
       WHERE m.id = $2`,
      [toFacilityId, motherId]
    );
    if (motherInfo.rows.length > 0) {
      const { phone, first_name, facility_name } = motherInfo.rows[0];
      const urgency = referral.priority === 'emergency' ? 'URGENT: ' : referral.priority === 'urgent' ? 'Urgent: ' : '';
      smsService.sendSms(phone, `Boresha-Mama: ${urgency}Hello ${first_name}, you have been referred to ${facility_name} (${referral.referral_reason}). Please visit as soon as possible.`).catch(err => {
        logger.error('Referral SMS failed:', err.message);
      });
    }

    res.status(201).json(referral);
  } catch (err) {
    next(err);
  }
};

exports.getReferrals = async (req, res, next) => {
  try {
    let query = `
      SELECT r.*,
             u1.first_name || ' ' || u1.last_name as referred_by,
             u2.first_name || ' ' || u2.last_name as mother_name,
             f1.name as from_facility,
             f2.name as to_facility
      FROM referrals r
      JOIN users u1 ON r.from_chv_id = u1.id
      JOIN mothers m ON r.mother_id = m.id
      JOIN users u2 ON m.user_id = u2.id
      LEFT JOIN facilities f1 ON r.from_facility_id = f1.id
      JOIN facilities f2 ON r.to_facility_id = f2.id
    `;
    const conditions = [];
    const params = [];

    if (req.user.role === 'chv') {
      conditions.push('r.from_chv_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'facility_staff') {
      conditions.push('(r.to_facility_id = (SELECT facility_id FROM facility_staff WHERE user_id = $1) OR r.from_facility_id = (SELECT facility_id FROM facility_staff WHERE user_id = $1))');
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push(`r.status = $${params.length + 1}`);
      params.push(req.query.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateReferralStatus = async (req, res, next) => {
  try {
    const { status, outcome } = req.body;

    const result = await db.query(
      `UPDATE referrals SET status = $1, outcome = $2, outcome_updated_by = $3,
        outcome_updated_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, outcome, req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Referral not found', 404);
    }

    const referral = result.rows[0];
    logger.info(`Referral ${req.params.id} updated to ${status}`);

    const motherInfo = await db.query(
      `SELECT u.phone, u.first_name, f.name as facility_name
       FROM referrals r
       JOIN mothers m ON r.mother_id = m.id
       JOIN users u ON m.user_id = u.id
       JOIN facilities f ON r.to_facility_id = f.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (motherInfo.rows.length > 0) {
      const { phone, first_name, facility_name } = motherInfo.rows[0];
      if (status === 'accepted') {
        smsService.sendSms(phone, `Boresha-Mama: Hello ${first_name}, your referral to ${facility_name} has been accepted. Please visit the facility.`).catch(err => {
          logger.error('Referral status SMS failed:', err.message);
        });
      } else if (status === 'completed') {
        smsService.sendSms(phone, `Boresha-Mama: Hello ${first_name}, your referral to ${facility_name} has been marked as completed. We hope you received the care you needed.`).catch(err => {
          logger.error('Referral status SMS failed:', err.message);
        });
      }
    }

    res.json(referral);
  } catch (err) {
    next(err);
  }
};
