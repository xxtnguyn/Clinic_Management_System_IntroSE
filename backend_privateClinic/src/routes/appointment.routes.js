const express = require('express');

const AppointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { appointmentSchema } = require('../schemas');
const { 
  createAppointmentSchema, 
  updateAppointmentSchema,
  cancelAppointmentSchema 
} = appointmentSchema;
const validate = require('../middlewares/validation.middleware');

const router = express.Router();


// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/appointments
// Mô tả: Lấy danh sách tất cả lịch hẹn với bộ lọc
// Quyền: view_appointments
router.get(
  '/',
  authorize(['view_appointments']),
  AppointmentController.getAllAppointments
);

// Route: GET /api/appointments/by-date/:date
// Mô tả: Lấy danh sách lịch hẹn theo ngày
// Quyền: view_appointments
router.get(
  '/by-date/:date',
  authorize(['view_appointments']),
  AppointmentController.getAppointmentsByDate
);

// Route: GET /api/appointments/limits
// Mô tả: Lấy thông tin về giới hạn bệnh nhân trong ngày
// Quyền: view_appointments
router.get(
  '/limits',
  authorize(['view_appointments']),
  AppointmentController.getAppointmentLimits
);

// Route: GET /api/appointments/:id
// Mô tả: Lấy thông tin của một lịch hẹn
// Quyền: view_appointments
router.get(
  '/:id',
  authorize(['view_appointments']),
  AppointmentController.getAppointmentById
);

// Route: POST /api/appointments
// Mô tả: Tạo lịch hẹn mới
// Quyền: create_appointment
router.post(
  '/',
  authorize(['create_appointment']),
  validate(createAppointmentSchema),
  AppointmentController.createAppointment
);

// Route: PUT /api/appointments/:id
// Mô tả: Cập nhật thông tin lịch hẹn
// Quyền: update_appointment
router.put(
  '/:id',
  authorize(['update_appointment']),
  validate(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

// Route: PATCH /api/appointments/:id/cancel
// Mô tả: Hủy lịch hẹn
// Quyền: cancel_appointment
router.patch(
  '/:id/cancel',
  authorize(['cancel_appointment']),
  validate(cancelAppointmentSchema),
  AppointmentController.cancelAppointment
);

module.exports = router;
