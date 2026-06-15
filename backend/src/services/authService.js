const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const smsService = require('./smsService');
const { sanitizePhone } = require('../utils/helpers');

class AuthService {
  async register(userData) {
    const { password, firstName, lastName, role, nationalId } = userData;
    const phone = sanitizePhone(userData.phone);
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      if (role === 'mother') {
        throw new AppError('Mother registration must be done by a CHV or health facility. Please visit your nearest health facility.', 403);
      }

      const existingUser = await client.query(
        'SELECT id FROM users WHERE phone = $1',
        [phone]
      );
      if (existingUser.rows.length > 0) {
        throw new AppError('Phone number already registered', 409);
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
      const userId = uuidv4();
      await client.query(
        `INSERT INTO users (id, phone, national_id, first_name, last_name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, phone, nationalId, firstName, lastName, passwordHash, role]
      );

      // Create role-specific profile
      if (role === 'mother') {
        await client.query(
          'INSERT INTO mothers (user_id) VALUES ($1)',
          [userId]
        );
      } else if (role === 'chv') {
        const { areaOfCoverage, facilityId, dateOfBirth, gender, educationLevel, chvRegistrationNumber, trainingDate, village, subLocation, emergencyContactName, emergencyContactPhone, yearsOfExperience } = userData;
        await client.query(
          `INSERT INTO chv_profiles (user_id, facility_id, area_of_coverage, years_of_experience, date_of_birth, gender, education_level, chv_registration_number, training_date, village, sub_location, emergency_contact_name, emergency_contact_phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [userId, facilityId || null, areaOfCoverage || null, yearsOfExperience || 0,
           dateOfBirth || null, gender || null, educationLevel || null, chvRegistrationNumber || null,
           trainingDate || null, village || null, subLocation || null, emergencyContactName || null, emergencyContactPhone || null]
        );
      } else if (role === 'facility_staff') {
        const { facilityId, jobTitle } = userData;
        await client.query(
          'INSERT INTO facility_staff (user_id, facility_id, job_title) VALUES ($1, $2, $3)',
          [userId, facilityId, jobTitle]
        );
      }

      await client.query('COMMIT');

      const token = this.generateToken({ id: userId, role, phone });
      logger.info(`User registered: ${phone} as ${role}`);

      return { userId, token, role };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async login(identifier, password) {
    const phone = sanitizePhone(identifier);
    const result = await db.query(
      'SELECT id, phone, password_hash, role, first_name, last_name, is_active FROM users WHERE phone = $1 OR phone = $2 OR email = $1',
      [identifier, phone]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email/phone or password', 401);
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new AppError('Account is deactivated. Contact administrator.', 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email/phone or password', 401);
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = this.generateToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
    });

    logger.info(`User logged in: ${identifier}`);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const result = await db.query(
        'SELECT id, phone, role, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
      if (result.rows.length === 0) {
        throw new AppError('User not found or inactive', 401);
      }
      return result.rows[0];
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async registerMother(motherData, registeredByUser) {
    const { password, firstName, lastName, nationalId, lmpDate, facilityId,
            gravida, parity, village, subLocation, ward, constituency,
            emergencyContactName, emergencyContactPhone, alternatePhone } = motherData;
    const phone = sanitizePhone(motherData.phone);
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const existingUser = await client.query(
        'SELECT id FROM users WHERE phone = $1',
        [phone]
      );
      if (existingUser.rows.length > 0) {
        throw new AppError('Phone number already registered', 409);
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
      const userId = uuidv4();

      await client.query(
        `INSERT INTO users (id, phone, national_id, first_name, last_name, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [userId, phone, nationalId || null, firstName, lastName, passwordHash, 'mother']
      );

      let chvId = null;
      if (registeredByUser.role === 'chv') {
        chvId = registeredByUser.id;
      }

      const motherResult = await client.query(
        `INSERT INTO mothers (user_id, village, sub_location, ward, constituency, emergency_contact_name, emergency_contact_phone, alternate_phone, chv_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [userId, village || null, subLocation || null, ward || null, constituency || 'Kiminini', emergencyContactName || null, emergencyContactPhone || null, alternatePhone || null, chvId]
      );
      const motherId = motherResult.rows[0].id;

      const lmp = new Date(lmpDate);
      const edd = new Date(lmp);
      edd.setDate(edd.getDate() + 280);
      const eddDate = edd.toISOString().split('T')[0];

      const pregnancyResult = await client.query(
        `INSERT INTO pregnancies (mother_id, registered_by, facility_id, lmp_date, edd_date, gravida, parity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [motherId, registeredByUser.id, facilityId || null, lmpDate, eddDate, gravida || 1, parity || 0]
      );

      const pregnancy = pregnancyResult.rows[0];

      if (registeredByUser.role === 'chv') {
        await client.query(
          `INSERT INTO home_visits (pregnancy_id, mother_id, chv_id, visit_date, visit_type, notes)
           VALUES ($1, $2, $3, CURRENT_DATE, 'antenatal', $4)`,
          [pregnancy.id, motherId, registeredByUser.id, 'Initial registration visit']
        );
      }

      await client.query('COMMIT');

      const token = this.generateToken({ id: userId, role: 'mother', phone });
      logger.info(`Mother registered by ${registeredByUser.role} ${registeredByUser.id}: ${phone}`);

      const smsMessage = `Welcome to Boresha Mama. Your account has been created. Use phone ${phone} and password ${password} to log in. Please change your password after first login.`;
      smsService.sendSms(phone, smsMessage).catch(err => {
        logger.error('SMS notification failed for new mother:', err.message);
      });

      return {
        user: { id: userId, phone, firstName, lastName, role: 'mother' },
        pregnancy: pregnancyResult.rows[0],
        token,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const newHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    logger.info(`Password changed for user: ${userId}`);
  }
}

module.exports = new AuthService();
