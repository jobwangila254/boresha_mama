// TODO: refactor this file, it's getting too big
const authService = require('../services/authService');
const db = require('../config/database');
// FIXME: AppError path might be wrong after recent refactor
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

exports.registerMotherSelf = async (req, res, next) => {
  try {
    const result = await authService.registerMotherSelf(req.body);
    res.status(201).json({
      message: 'Mother registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
};

exports.saveOnboarding = async (req, res, next) => {
  try {
    const result = await authService.saveOnboarding(req.user.id, req.body.data);
    res.json({
      message: 'Onboarding completed successfully',
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

// i think this works for registration
exports.register = async (req, res, next) => {
  try {
    // console.log('register attempt:', req.body.phone);
    const result = await authService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.userId,
      token: result.token,
      role: result.role,
    });
  } catch (err) {
    // TODO: add better error handling here
    next(err);
  }
};

// HACK: this should be split into multiple functions
exports.registerMother = async (req, res, next) => {
  try {
    const result = await authService.registerMother(req.body, req.user);
    res.status(201).json({
      message: 'Mother registered successfully with active pregnancy',
      user: result.user,
      pregnancy: result.pregnancy,
      tempPassword: result.tempPassword,
      token: result.token,
    });
  } catch (err) {
    // FIXME: this might leak sensitive info in production
    next(err);
  }
};

// why does this sometimes fail? TODO: investigate
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    // console.log('login attempt:', identifier);
    const result = await authService.login(identifier, password);
    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    // i think this is fine but need to check
    next(err);
  }
};

// FIXME: this query is huge and ugly, need to refactor
exports.getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.phone, u.national_id, u.first_name, u.last_name, u.email,
               u.role, u.preferred_language, u.created_at,
               m.date_of_birth, m.village, m.sub_location, m.ward, m.constituency,
               m.emergency_contact_name, m.emergency_contact_phone, m.alternate_phone,
               m.is_high_risk, m.completed_onboarding, m.onboarding_data
        FROM users u
        LEFT JOIN mothers m ON u.id = m.user_id
        WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const profile = result.rows[0];
    // TODO: move this role-specific logic to separate functions
    if (profile.role === 'chv') {
      try {
        const chvResult = await db.query(
          'SELECT * FROM chv_profiles WHERE user_id = $1',
          [req.user.id]
        );
        profile.chvProfile = chvResult.rows[0] || null;
      } catch (chvErr) {
        logger.error('CHV profile query failed:', chvErr);
        profile.chvProfile = null;
      }
    } else if (profile.role === 'facility_staff') {
      try {
        const staffResult = await db.query(
          'SELECT fs.*, f.name as facility_name, f.type as facility_type, f.level as facility_level, f.ward as facility_ward, f.constituency as facility_constituency FROM facility_staff fs JOIN facilities f ON fs.facility_id = f.id WHERE fs.user_id = $1',
          [req.user.id]
        );
        profile.facilityStaff = staffResult.rows[0] || null;
      } catch (staffErr) {
        logger.error('Facility staff profile query failed:', staffErr);
        // Return partial profile instead of failing completely
        profile.facilityStaff = null;
      }
    } else if (profile.role === 'mother') {
      try {
        // HACK: only getting the latest pregnancy, might need all
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

        // FIXME: this only gets the next appointment, need all future ones
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
      } catch (motherErr) {
        logger.error('Mother profile query failed:', motherErr);
      }
    }

    res.json(profile);
  } catch (err) {
    // FIXME: this error doesn't tell you what really failed
    next(err);
  }
};

// TODO: add validation for allowed fields
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['first_name', 'last_name', 'email', 'preferred_language', 'national_id'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // why do i need to do this manually? TODO: use a library
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

    // HACK: this should be in a separate service
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
    // FIXME: this could fail silently
    next(err);
  }
};

// TODO: add pagination here
exports.getUsers = async (req, res, next) => {
  try {
    const role = req.query.role;
    const roles = role ? role.split(',') : [];
    // HACK: this query is a mess, need to break it down
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
    // i think this needs more specific error handling
    next(err);
  }
};

// FIXME: this doesn't check if the user exists before toggling
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
    // TODO: log this properly
    next(err);
  }
};

// TODO: add password validation (min length, special chars)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // console.log('password change attempt for user:', req.user.id);
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    // FIXME: this error doesn't tell you if current password is wrong
    next(err);
  }
};