const MedicalRecord = require('../models/medicalRecord.model');
const { ValidationError } = require('../utils/apiError');

/**
 * MedicalRecordController
 * Xử lý các request liên quan đến hồ sơ bệnh án
 */
class MedicalRecordController {
  /**
   * Lấy danh sách hồ sơ bệnh án
   * @route GET /api/medical-records
   */
  static async getAllMedicalRecords(req, res, next) {
    try {
      const { 
        patientId, staffId, startDate, endDate, 
        diseaseTypeId, status, page, limit 
      } = req.query;
      
      const medicalRecords = await MedicalRecord.findAll({ 
        patientId, staffId, startDate, endDate, 
        diseaseTypeId, status, page, limit 
      });
      
      res.status(200).json({
        success: true,
        ...medicalRecords
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin hồ sơ bệnh án theo ID
   * @route GET /api/medical-records/:id
   */
  static async getMedicalRecordById(req, res, next) {
    try {
      const { id } = req.params;
      const medicalRecord = await MedicalRecord.findById(id);
      
      res.status(200).json({
        success: true,
        data: medicalRecord
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo hồ sơ bệnh án mới
   * @route POST /api/medical-records
   */
  static async createMedicalRecord(req, res, next) {
    try {
      // Thêm staff_id từ người dùng hiện tại
      const data = {
        ...req.body,
        staff_id: req.user.id
      };
      
      const medicalRecord = await MedicalRecord.create(data);
      
      res.status(201).json({
        success: true,
        message: 'Tạo hồ sơ bệnh án thành công',
        data: medicalRecord
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật hồ sơ bệnh án
   * @route PUT /api/medical-records/:id
   */
  static async updateMedicalRecord(req, res, next) {
    try {
      const { id } = req.params;
      const medicalRecord = await MedicalRecord.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật hồ sơ bệnh án thành công',
        data: medicalRecord
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa hồ sơ bệnh án
   * @route DELETE /api/medical-records/:id
   */
  static async deleteMedicalRecord(req, res, next) {
    try {
      const { id } = req.params;
      await MedicalRecord.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa hồ sơ bệnh án thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy danh sách đơn thuốc của hồ sơ bệnh án
   * @route GET /api/medical-records/:id/prescriptions
   */
  static async getMedicalRecordPrescriptions(req, res, next) {
    try {
      const { id } = req.params;
      const prescriptions = await MedicalRecord.getPrescriptions(id);
      
      res.status(200).json({
        success: true,
        data: prescriptions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin hóa đơn của hồ sơ bệnh án
   * @route GET /api/medical-records/:id/invoice
   */
  static async getMedicalRecordInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await MedicalRecord.getInvoice(id);
      
      if (!invoice) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Hồ sơ bệnh án này chưa có hóa đơn'
        });
      }
      
      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MedicalRecordController;
