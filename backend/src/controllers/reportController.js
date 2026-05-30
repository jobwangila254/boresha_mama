const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === 'county_admin') {
      const statsResult = await db.query(`
        SELECT
          COUNT(*)::int AS total_mothers,
          COUNT(*) FILTER (WHERE p.status = 'active')::int AS active_pregnancies,
          COUNT(*) FILTER (WHERE p.status = 'active' AND p.risk_level IN ('high', 'critical'))::int AS high_risk_pregnancies,
          COUNT(DISTINCT p.mother_id) FILTER (WHERE p.status = 'active')::int AS enrolled_mothers
        FROM mothers m
        LEFT JOIN pregnancies p ON p.mother_id = m.id
      `);

      const [facilities, chvs, referrals, weekApts] = await Promise.all([
        db.query('SELECT COUNT(*)::int AS total FROM facilities'),
        db.query('SELECT COUNT(*)::int AS total FROM users WHERE role = $1 AND is_active = true', ['chv']),
        db.query(`SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
          FROM referrals`),
        db.query(`SELECT COUNT(*)::int AS total FROM appointments
          WHERE appointment_date >= date_trunc('week', NOW())
          AND appointment_date < date_trunc('week', NOW()) + INTERVAL '1 week'`),
      ]);

      const r = statsResult.rows[0];
      const totalMothers = r.total_mothers;

      const monthlyDeliveries = await db.query(`
        SELECT DATE_TRUNC('month', delivered_at) as month, COUNT(*)
        FROM pregnancies WHERE delivered_at IS NOT NULL
        AND delivered_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month DESC
      `);

      stats = {
        totalMothers,
        activePregnancies: r.active_pregnancies,
        highRiskPregnancies: r.high_risk_pregnancies,
        totalFacilities: facilities.rows[0].total,
        totalCHVs: chvs.rows[0].total,
        totalReferrals: referrals.rows[0].total,
        pendingReferrals: referrals.rows[0].pending,
        ancCoverage: totalMothers > 0
          ? parseFloat(((r.enrolled_mothers / totalMothers) * 100).toFixed(1))
          : 0,
        weekAppointments: weekApts.rows[0].total,
        monthlyDeliveries: monthlyDeliveries.rows,
      };
    } else if (role === 'facility_staff') {
      const facilityId = await db.query(
        'SELECT facility_id FROM facility_staff WHERE user_id = $1',
        [req.user.id]
      );
      if (facilityId.rows.length === 0) throw new AppError('Facility staff profile not found', 404);
      const fid = facilityId.rows[0].facility_id;

      const totalPatients = await db.query('SELECT COUNT(*) FROM pregnancies WHERE facility_id = $1', [fid]);
      const todayAppointments = await db.query(
        "SELECT COUNT(*) FROM appointments WHERE facility_id = $1 AND DATE(appointment_date) = CURRENT_DATE",
        [fid]
      );
      const pendingReferrals = await db.query(
        "SELECT COUNT(*) FROM referrals WHERE (to_facility_id = $1 OR from_facility_id = $1) AND status = 'pending'",
        [fid]
      );

      stats = {
        totalPatients: parseInt(totalPatients.rows[0].count),
        todayAppointments: parseInt(todayAppointments.rows[0].count),
        pendingReferrals: parseInt(pendingReferrals.rows[0].count),
      };
    }

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getKPIData = async (req, res, next) => {
  try {
    const { period: periodRaw = 'monthly', startDate, endDate } = req.query;
    const truncMap = { monthly: 'month', quarterly: 'quarter', daily: 'day', weekly: 'week' };
    const period = truncMap[periodRaw] || periodRaw;

    const ancCoverage = await db.query(`
      SELECT
        DATE_TRUNC($1, p.created_at) as period,
        COUNT(DISTINCT p.id) as pregnancies,
        COUNT(DISTINCT hv.id) as home_visits,
        COUNT(DISTINCT r.id) as referrals,
        COUNT(DISTINCT CASE WHEN p.risk_level IN ('high','critical') THEN p.id END) as high_risk
      FROM pregnancies p
      LEFT JOIN home_visits hv ON p.id = hv.pregnancy_id
      LEFT JOIN referrals r ON p.id = r.pregnancy_id
      WHERE ($2::date IS NULL OR p.created_at >= $2)
        AND ($3::date IS NULL OR p.created_at <= $3)
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `, [period, startDate, endDate]);

    res.json(ancCoverage.rows);
  } catch (err) {
    next(err);
  }
};

exports.exportReport = async (req, res, next) => {
  try {
    const { format = 'json', type, startDate, endDate } = req.query;
    let data;

    switch (type) {
      case 'pregnancies': {
        const params = [startDate, endDate];
        let facilityClause = '';
        if (req.user.role === 'facility_staff') {
          facilityClause = ` AND p.facility_id = $${params.length + 1}`;
          const facResult = await db.query(
            'SELECT facility_id FROM facility_staff WHERE user_id = $1',
            [req.user.id]
          );
          if (facResult.rows.length > 0) params.push(facResult.rows[0].facility_id);
        }
        const pregnancies = await db.query(`
          SELECT u.national_id as mother_id_no,
                 u.first_name || ' ' || u.last_name as mother_name,
                 u.phone as mother_phone,
                 m.village || ', ' || m.ward || ', ' || m.constituency as location,
                 reg.first_name || ' ' || reg.last_name as registered_by,
                 f.name as facility_name,
                 p.lmp_date, p.edd_date, p.gravida, p.parity, p.status, p.risk_level,
                 p.created_at
          FROM pregnancies p
          JOIN mothers m ON p.mother_id = m.id
          JOIN users u ON m.user_id = u.id
          LEFT JOIN facilities f ON p.facility_id = f.id
          LEFT JOIN users reg ON p.registered_by = reg.id
          WHERE ($1::date IS NULL OR p.created_at >= $1)
            AND ($2::date IS NULL OR p.created_at <= $2)
            ${facilityClause}
          ORDER BY p.created_at DESC
        `, params);
        data = pregnancies.rows;
        break;
      }

      case 'referrals': {
        const refParams = [startDate, endDate];
        let refFacilityClause = '';
        if (req.user.role === 'facility_staff') {
          refFacilityClause = ` AND (r.to_facility_id = $${refParams.length + 1} OR r.from_facility_id = $${refParams.length + 1})`;
          const facResult = await db.query('SELECT facility_id FROM facility_staff WHERE user_id = $1', [req.user.id]);
          if (facResult.rows.length > 0) refParams.push(facResult.rows[0].facility_id);
        }
        const referrals = await db.query(`
          SELECT r.*, u1.first_name || ' ' || u1.last_name as referred_by,
                 u2.first_name || ' ' || u2.last_name as mother_name,
                 f2.name as to_facility
          FROM referrals r
          JOIN users u1 ON r.from_chv_id = u1.id
          JOIN mothers m ON r.mother_id = m.id
          JOIN users u2 ON m.user_id = u2.id
          JOIN facilities f2 ON r.to_facility_id = f2.id
          WHERE ($1::date IS NULL OR r.created_at >= $1)
            AND ($2::date IS NULL OR r.created_at <= $2)
            ${refFacilityClause}
          ORDER BY r.created_at DESC
        `, refParams);
        data = referrals.rows;
        break;
      }

      case 'chv_performance': {
        let chvWhere = "WHERE u.role = 'chv'";
        const chvParams = [];
        if (req.user.role === 'facility_staff') {
          const facResult = await db.query('SELECT facility_id FROM facility_staff WHERE user_id = $1', [req.user.id]);
          if (facResult.rows.length > 0) {
            chvWhere += ' AND cp.facility_id = $1';
            chvParams.push(facResult.rows[0].facility_id);
          }
        }
        data = await db.query(`
          SELECT u.id, u.first_name, u.last_name, u.phone,
                 COUNT(DISTINCT hv.id) as total_visits,
                 COUNT(DISTINCT r.id) as total_referrals,
                 COUNT(DISTINCT p.id) as registered_pregnancies
          FROM users u
          LEFT JOIN chv_profiles cp ON cp.user_id = u.id
          LEFT JOIN home_visits hv ON u.id = hv.chv_id
          LEFT JOIN referrals r ON u.id = r.from_chv_id
          LEFT JOIN pregnancies p ON u.id = p.registered_by
          ${chvWhere}
          GROUP BY u.id, u.first_name, u.last_name, u.phone
          ORDER BY total_visits DESC
        `, chvParams);
        data = data.rows;
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'json') {
      res.json(data);
    } else {
      // CSV export
      if (data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }

      let headers, rows;

      if (type === 'pregnancies') {
        const fmt = d => d ? new Date(d).toISOString().split('T')[0] : '';
        headers = ['Mother ID No', 'Name', 'Phone', 'Location', 'Registered By', 'Facility', 'LMP', 'EDD', 'Gravida', 'Parity', 'Status', 'Risk Level', 'Date Registered'];
        rows = data.map(r => [
          r.mother_id_no, r.mother_name, r.mother_phone, r.location,
          r.registered_by, r.facility_name, fmt(r.lmp_date), fmt(r.edd_date),
          r.gravida, r.parity, r.status, r.risk_level, fmt(r.created_at),
        ].map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(','));
      } else {
        headers = Object.keys(data[0]);
        rows = data.map(row =>
          headers.map(h => {
            const val = row[h];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          }).join(',')
        );
      }

      const csvRows = [
        headers.join(','),
        ...rows,
      ];
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
      res.send(csv);
    }
  } catch (err) {
    next(err);
  }
};
