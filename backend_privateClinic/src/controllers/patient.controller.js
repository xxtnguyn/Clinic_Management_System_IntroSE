const Patient = require('../models/patient.model');
const { ValidationError } = require('../utils/apiError');

/**
 * PatientController
 * Xử lý các request liên quan đến bệnh nhân
 */
class PatientController {
  /**
   * Lấy danh sách bệnh nhân
   * @route GET /api/patients
   */
  static async getAllPatients(req, res, next) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      
      const result = await Patient.findAll({
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin chi tiết bệnh nhân
   * @route GET /api/patients/:id
   */
  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);
      
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo bệnh nhân mới
   * @route POST /api/patients
   */
  /**
   * Tạo bệnh nhân mới
   * @route POST /api/patients
   */
  static async createPatient(req, res, next) {
    try {
      const patient = await Patient.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo bệnh nhân thành công',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật thông tin bệnh nhân
   * @route PUT /api/patients/:id
   */
  /**
   * Cập nhật thông tin bệnh nhân
   * @route PUT /api/patients/:id
   */
  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin bệnh nhân thành công',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy lịch sử khám bệnh của bệnh nhân
   * @route GET /api/patients/:id/medical-history
   */
  static async getPatientMedicalHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await Patient.getMedicalHistory(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa bệnh nhân
   * @route DELETE /api/patients/:id
   */
  static async deletePatient(req, res, next) {
    try {
      const { id } = req.params;
      await Patient.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa bệnh nhân thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tìm kiếm bệnh nhân theo số điện thoại hoặc tên
   * @route GET /api/patients/search
   */
  static async searchPatients(req, res, next) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
      
      const patients = await Patient.search(query);
      
      res.status(200).json({
        success: true,
        data: patients
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;
