const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

exports.createAppointment = async (req, res, next) => {
  try {
    const { pregnancyId, motherId, facilityId, appointmentDate, visitType, reason } = req.body;

    const result = await db.query(
      `INSERT INTO appointments (pregnancy_id, mother_id, facility_id, scheduled_by, appointment_date, visit_type, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [pregnancyId, motherId, facilityId, req.user.id, appointmentDate, visitType, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    let query = `
      SELECT a.*, f.name as facility_name,
             u.first_name || ' ' || u.last_name as mother_name
      FROM appointments a
      JOIN mothers m ON a.mother_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN facilities f ON a.facility_id = f.id
    `;
    const conditions = [];
    const params = [];

    if (req.user.role === 'mother') {
      conditions.push('m.user_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'facility_staff') {
      conditions.push('a.facility_id = (SELECT facility_id FROM facility_staff WHERE user_id = $1)');
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(req.query.status);
    }

    if (req.query.startDate) {
      conditions.push(`a.appointment_date >= $${params.length + 1}`);
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      conditions.push(`a.appointment_date <= $${params.length + 1}`);
      params.push(req.query.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, notes, cancellationReason } = req.body;
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(status);
      if (status === 'completed') {
        updateFields.push(`completed_at = $${paramIndex++}`);
        params.push(new Date().toISOString());
      } else if (status === 'cancelled') {
        updateFields.push(`cancelled_at = $${paramIndex++}`);
        params.push(new Date().toISOString());
      }
    }

    if (notes) {
      updateFields.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (cancellationReason) {
      updateFields.push(`cancellation_reason = $${paramIndex++}`);
      params.push(cancellationReason);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE appointments SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
