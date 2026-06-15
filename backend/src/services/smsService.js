const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');
const db = require('../config/database');

class SmsService {
  constructor() {
    this.provider = (config.sms.provider || 'africastalking').toLowerCase();
    this.apiKey = config.sms.apiKey;
    this.username = config.sms.username;
    this.baseUrl = this.username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';
  }

  async sendSms(recipients, message) {
    if (this.provider !== 'africastalking') {
      logger.info(`SMS provider set to '${this.provider}'. Logging demo SMS instead of sending.`);
      const phoneNumbers = Array.isArray(recipients) ? recipients : [recipients];
      logger.info(`Demo SMS to ${phoneNumbers.join(', ')}: ${message}`);
      return { status: 'skipped', reason: `provider ${this.provider}` };
    }

    if (!this.apiKey || !this.username || this.apiKey.startsWith('your_') || this.username.startsWith('your_')) {
      logger.warn('SMS credentials not configured. Skipping SMS send.');
      return { status: 'skipped', reason: 'No credentials' };
    }

    const phoneNumbers = Array.isArray(recipients) ? recipients : [recipients];
    const formattedNumbers = phoneNumbers.map(p =>
      p.startsWith('+') ? p : `+${p}`
    );

    try {
      const auth = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}`,
        new URLSearchParams({
          username: this.username,
          to: formattedNumbers.join(','),
          message,
          from: config.sms.senderId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      logger.info(`SMS sent to ${formattedNumbers.length} recipients: ${message.substring(0, 50)}...`);
      return response.data;
    } catch (err) {
      const errorDetail = err.response?.data || err.message;
      logger.error('SMS send failed:', errorDetail);
      return { status: 'failed', error: errorDetail };
    }
  }

  async sendReminder(userId, message) {
    try {
      const userResult = await db.query(
        'SELECT phone, preferred_language FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length === 0) {
        logger.warn(`User ${userId} not found for SMS reminder`);
        return;
      }

      const { phone } = userResult.rows[0];
      await this.sendSms(phone, message);

      // Log notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, channel)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'Appointment Reminder', message, 'reminder', 'sms']
      );
    } catch (err) {
      logger.error('Failed to send reminder SMS:', err);
    }
  }

  async sendAppointmentReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    try {
      const appointments = await db.query(
        `SELECT a.id, a.appointment_date, u.phone, u.first_name, u.id as user_id,
                f.name as facility_name, a.visit_type
         FROM appointments a
         JOIN mothers m ON a.mother_id = m.id
         JOIN users u ON m.user_id = u.id
         JOIN facilities f ON a.facility_id = f.id
         WHERE DATE(a.appointment_date) = $1 AND a.status = 'scheduled' AND a.reminder_sent = false`,
        [tomorrowDate]
      );

      for (const apt of appointments.rows) {
        const message = `Boresha-Mama: Hello ${apt.first_name}, this is a reminder of your ${apt.visit_type} appointment at ${apt.facility_name} tomorrow. Please carry your clinic card.`;
        await this.sendReminder(apt.user_id, message);

        await db.query(
          'UPDATE appointments SET reminder_sent = true, reminder_sent_at = NOW() WHERE id = $1',
          [apt.id]
        );
      }

      logger.info(`Sent ${appointments.rows.length} appointment reminders`);
    } catch (err) {
      logger.error('Failed to send appointment reminders:', err);
    }
  }

  async sendHealthTip(userId, tip) {
    const message = `Boresha-Mama Health Tip: ${tip}`;
    await this.sendReminder(userId, message);
  }
}

module.exports = new SmsService();
