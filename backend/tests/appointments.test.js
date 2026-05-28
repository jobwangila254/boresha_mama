jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { query } = require('../src/config/database');
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
} = require('../src/controllers/appointmentController');

describe('Appointment Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'mother' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('createAppointment', () => {
    it('should create an appointment and return 201', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        facilityId: 'fac-1',
        appointmentDate: '2026-06-01',
        visitType: 'prenatal',
        reason: 'routine checkup',
      };

      const fakeRow = { id: 'appt-1', pregnancy_id: 'preg-1', status: 'scheduled' };
      query.mockResolvedValue({ rows: [fakeRow] });

      await createAppointment(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments'),
        [req.body.pregnancyId, req.body.motherId, req.body.facilityId, req.user.id,
         req.body.appointmentDate, req.body.visitType, req.body.reason]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on DB failure', async () => {
      req.body = {
        pregnancyId: 'preg-1',
        motherId: 'mother-1',
        facilityId: 'fac-1',
        appointmentDate: '2026-06-01',
        visitType: 'prenatal',
        reason: 'routine',
      };

      const error = new Error('DB connection failed');
      query.mockRejectedValue(error);

      await createAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getAppointments', () => {
    it('should return appointments list for a mother role', async () => {
      req.user = { id: 'mother-user-1', role: 'mother' };
      const fakeRows = [
        { id: 'appt-1', appointment_date: '2026-06-01', facility_name: 'Clinic A' },
        { id: 'appt-2', appointment_date: '2026-06-15', facility_name: 'Clinic B' },
      ];
      query.mockResolvedValue({ rows: fakeRows });

      await getAppointments(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.*'),
        expect.arrayContaining([req.user.id])
      );
      expect(res.json).toHaveBeenCalledWith(fakeRows);
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter appointments by status query param', async () => {
      req.user = { id: 'chv-1', role: 'facility_staff' };
      req.query = { status: 'pending' };

      query.mockResolvedValue({ rows: [] });

      await getAppointments(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('a.status'),
        expect.arrayContaining(['pending'])
      );
      expect(res.json).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update status to completed and set completed_at', async () => {
      req.params = { id: 'appt-1' };
      req.body = { status: 'completed', notes: 'Visit done' };

      const fakeRow = { id: 'appt-1', status: 'completed', completed_at: expect.any(String) };
      query.mockResolvedValue({ rows: [fakeRow] });

      await updateAppointmentStatus(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments'),
        expect.arrayContaining(['completed', 'Visit done', 'appt-1'])
      );
      expect(res.json).toHaveBeenCalledWith(fakeRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update status to cancelled and set cancelled_at', async () => {
      req.params = { id: 'appt-1' };
      req.body = { status: 'cancelled', cancellationReason: 'No transport available' };

      const fakeRow = { id: 'appt-1', status: 'cancelled', cancelled_at: expect.any(String) };
      query.mockResolvedValue({ rows: [fakeRow] });

      await updateAppointmentStatus(req, res, next);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments'),
        expect.arrayContaining(['cancelled', 'No transport available', 'appt-1'])
      );
      expect(res.json).toHaveBeenCalledWith(fakeRow);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when no fields to update', async () => {
      req.params = { id: 'appt-1' };
      req.body = {};

      await updateAppointmentStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No fields to update' });
      expect(query).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
