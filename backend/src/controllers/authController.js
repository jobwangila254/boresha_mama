const authService = require('../services/authService');
const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.userId,
      token: result.token,
      role: result.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.registerMother = async (req, res, next) => {
  try {
    const result = await authService.registerMother(req.body, req.user);
    res.status(201).json({
      message: 'Mother registered successfully with active pregnancy',
      user: result.user,
      pregnancy: result.pregnancy,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.phone, u.national_id, u.first_name, u.last_name, u.email,
              u.role, u.preferred_language, u.created_at,
              m.date_of_birth, m.village, m.sub_location, m.ward, m.constituency,
              m.emergency_contact_name, m.emergency_contact_phone, m.alternate_phone, m.is_high_risk
       FROM users u
       LEFT JOIN mothers m ON u.id = m.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const profile = result.rows[0];

    // Fetch role-specific profile data
    if (profile.role === 'chv') {
      const chvResult = await db.query(
        'SELECT * FROM chv_profiles WHERE user_id = $1',
        [req.user.id]
      );
      profile.chvProfile = chvResult.rows[0] || null;
    } else if (profile.role === 'facility_staff') {
      const staffResult = await db.query(
        'SELECT fs.*, f.name as facility_name, f.type as facility_type, f.ward as facility_ward, f.constituency as facility_constituency FROM facility_staff fs JOIN facilities f ON fs.facility_id = f.id WHERE fs.user_id = $1',
        [req.user.id]
      );
      profile.facilityStaff = staffResult.rows[0] || null;
    } else if (profile.role === 'mother') {
      const pregResult = await db.query(
        `SELECT p.id, p.lmp_date, p.edd_date, p.gravida, p.parity,
                p.status, p.risk_level, p.risk_factors,
                u.first_name AS chv_first_name, u.last_name AS chv_last_name, u.phone AS chv_phone
         FROM pregnancies p
         JOIN mothers m ON m.id = p.mother_id
         LEFT JOIN users u ON u.id = m.chv_id
         WHERE m.user_id = $1
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [req.user.id]
      );
      profile.pregnancy = pregResult.rows[0] || null;

      const aptResult = await db.query(
        `SELECT a.appointment_date, a.visit_type, a.status, f.name AS facility_name
         FROM appointments a
         JOIN mothers m ON m.id = a.mother_id
         LEFT JOIN facilities f ON f.id = a.facility_id
         WHERE m.user_id = $1 AND a.status = 'scheduled' AND a.appointment_date >= CURRENT_DATE
         ORDER BY a.appointment_date ASC
         LIMIT 1`,
        [req.user.id]
      );
      profile.nextAppointment = aptResult.rows[0] || null;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['first_name', 'last_name', 'email', 'preferred_language'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.user.id);
    await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values
    );

    // Update mother-specific fields
    if (req.user.role === 'mother') {
      const motherFields = ['date_of_birth', 'village', 'sub_location', 'ward', 'emergency_contact_name', 'emergency_contact_phone', 'alternate_phone'];
      const motherUpdates = [];
      const motherValues = [];
      let mParamIndex = 1;

      for (const [key, value] of Object.entries(req.body)) {
        if (motherFields.includes(key)) {
          motherUpdates.push(`${key} = $${mParamIndex}`);
          motherValues.push(value);
          mParamIndex++;
        }
      }

      if (motherUpdates.length > 0) {
        motherValues.push(req.user.id);
        await db.query(
          `UPDATE mothers SET ${motherUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${mParamIndex}`,
          motherValues
        );
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const role = req.query.role;
    const roles = role ? role.split(',') : [];
    const query = `
      SELECT
        u.id, u.phone, u.national_id, u.first_name, u.last_name, u.email,
        u.role, u.is_verified, u.is_active, u.created_at, u.last_login,
        jsonb_build_object(
          'id', cp.id,
          'facility_id', cp.facility_id,
          'area_of_coverage', cp.area_of_coverage,
          'years_of_experience', cp.years_of_experience,
          'date_of_birth', cp.date_of_birth,
          'gender', cp.gender,
          'education_level', cp.education_level,
          'chv_registration_number', cp.chv_registration_number,
          'training_date', cp.training_date,
          'village', cp.village,
          'sub_location', cp.sub_location,
          'emergency_contact_name', cp.emergency_contact_name,
          'emergency_contact_phone', cp.emergency_contact_phone
        ) AS "chvProfile",
        CASE WHEN fs.id IS NOT NULL THEN
          jsonb_build_object(
            'facility_id', fs.facility_id,
            'facility_name', f.name,
            'facility_ward', f.ward,
            'job_title', fs.job_title
          )
        ELSE NULL END AS facility_staff
      FROM users u
      LEFT JOIN chv_profiles cp ON cp.user_id = u.id
      LEFT JOIN facility_staff fs ON fs.user_id = u.id
      LEFT JOIN facilities f ON f.id = fs.facility_id
      ${roles.length > 0 ? 'WHERE u.role::text = ANY($1::text[])' : ''}
      ORDER BY u.created_at DESC
    `;
    const params = roles.length > 0 ? [roles] : [];
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await db.query('SELECT is_active FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const newStatus = !user.rows[0].is_active;
    await db.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, id]);

    res.json({ message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`, is_active: newStatus });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
