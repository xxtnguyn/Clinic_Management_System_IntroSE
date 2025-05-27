const Appointment = require('../models/appointment.model');
const { ValidationError } = require('../utils/apiError');

/**
 * AppointmentController
 * Xử lý các request liên quan đến lịch hẹn khám bệnh
 */
class AppointmentController {
  /**
   * Lấy danh sách lịch hẹn
   * @route GET /api/appointments
   */
  static async getAllAppointments(req, res, next) {
    try {
      const { date, status, patientId, page, limit } = req.query;
      const appointments = await Appointment.findAll({ 
        date, status, patientId, page, limit 
      });
      
      res.status(200).json({
        success: true,
        ...appointments
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy danh sách lịch hẹn theo ngày
   * @route GET /api/appointments/by-date/:date
   */
  static async getAppointmentsByDate(req, res, next) {
    try {
      const { date } = req.params;
      const appointments = await Appointment.findByDate(date);
      
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin lịch hẹn theo ID
   * @route GET /api/appointments/:id
   */
  static async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo lịch hẹn mới
   * @route POST /api/appointments
   */
  static async createAppointment(req, res, next) {
    try {
      const appointment = await Appointment.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo lịch hẹn thành công',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật lịch hẹn
   * @route PUT /api/appointments/:id
   */
  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật lịch hẹn thành công',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Hủy lịch hẹn
   * @route PATCH /api/appointments/:id/cancel
   */
  static async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Kiểm tra xem lý do hủy có được cung cấp không
      if (!reason || typeof reason !== 'string' || reason.trim() === '') {
        throw new ValidationError('Vui lòng cung cấp lý do hủy lịch hẹn');
      }
      
      const appointment = await Appointment.cancelAppointment(id, reason.trim());
      
      res.status(200).json({
        success: true,
        message: 'Đã hủy lịch hẹn thành công',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin về giới hạn bệnh nhân trong ngày
   * @route GET /api/appointments/limits
   */
  static async getAppointmentLimits(req, res, next) {
    try {
      const maxPatients = await Appointment.getMaxPatientsPerDay();
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const currentCount = await Appointment.getCurrentPatientCount(date);
      
      res.status(200).json({
        success: true,
        data: {
          date,
          maxPatients,
          currentCount,
          availableSlots: maxPatients - currentCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
