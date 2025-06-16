const Prescription = require('../models/prescription.model');
const { ValidationError } = require('../utils/apiError');

/**
 * PrescriptionController
 * Xử lý các request liên quan đến đơn thuốc
 */
class PrescriptionController {
  /**
   * Lấy danh sách đơn thuốc
   * @route GET /api/prescriptions
   */
  static async getAllPrescriptions(req, res, next) {
    try {
      const { medicalRecordId, medicineId, staffId, page, limit } = req.query;
      const prescriptions = await Prescription.findAll({ 
        medicalRecordId, medicineId, staffId, page, limit 
      });
      
      res.status(200).json({
        success: true,
        ...prescriptions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin đơn thuốc theo ID
   * @route GET /api/prescriptions/:id
   */
  static async getPrescriptionById(req, res, next) {
    try {
      const { id } = req.params;
      const prescription = await Prescription.findById(id);
      
      res.status(200).json({
        success: true,
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo đơn thuốc mới
   * @route POST /api/prescriptions
   */
  static async createPrescription(req, res, next) {
    try {
      // Thêm staff_id từ người dùng hiện tại
      const data = {
        ...req.body,
        staff_id: req.user.id
      };
      
      const prescription = await Prescription.create(data);
      
      res.status(201).json({
        success: true,
        message: 'Tạo đơn thuốc thành công',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật đơn thuốc
   * @route PUT /api/prescriptions/:id
   */
  static async updatePrescription(req, res, next) {
    try {
      const { id } = req.params;
      const prescription = await Prescription.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật đơn thuốc thành công',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa đơn thuốc
   * @route DELETE /api/prescriptions/:id
   */
  static async deletePrescription(req, res, next) {
    try {
      const { id } = req.params;
      await Prescription.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa đơn thuốc thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tính tổng tiền thuốc cho một hồ sơ bệnh án
   * @route GET /api/prescriptions/calculate-fee/:medicalRecordId
   */
  static async calculateMedicineFee(req, res, next) {
    try {
      const { medicalRecordId } = req.params;
      const totalFee = await Prescription.calculateTotalMedicineFee(medicalRecordId);
      
      res.status(200).json({
        success: true,
        data: {
          medicalRecordId: parseInt(medicalRecordId),
          totalFee
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PrescriptionController;
