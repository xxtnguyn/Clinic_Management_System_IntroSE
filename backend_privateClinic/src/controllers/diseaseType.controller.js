const DiseaseType = require('../models/diseaseType.model');
const { ValidationError } = require('../utils/apiError');

/**
 * DiseaseTypeController
 * Xử lý các request liên quan đến loại bệnh
 */
class DiseaseTypeController {
  /**
   * Lấy danh sách loại bệnh
   * @route GET /api/disease-types
   */
  static async getAllDiseaseTypes(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const diseaseTypes = await DiseaseType.findAll({ search, page, limit });
      
      res.status(200).json({
        success: true,
        ...diseaseTypes
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin loại bệnh theo ID
   * @route GET /api/disease-types/:id
   */
  static async getDiseaseTypeById(req, res, next) {
    try {
      const { id } = req.params;
      const diseaseType = await DiseaseType.findById(id);
      
      res.status(200).json({
        success: true,
        data: diseaseType
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo loại bệnh mới
   * @route POST /api/disease-types
   */
  static async createDiseaseType(req, res, next) {
    try {
      const { name } = req.body;
      
      // Kiểm tra tên loại bệnh đã tồn tại chưa
      const nameExists = await DiseaseType.isNameExists(name);
      if (nameExists) {
        throw new ValidationError('Tên loại bệnh đã tồn tại');
      }
      
      const diseaseType = await DiseaseType.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo loại bệnh thành công',
        data: diseaseType
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật loại bệnh
   * @route PUT /api/disease-types/:id
   */
  static async updateDiseaseType(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      // Nếu có cập nhật tên, kiểm tra tên mới có trùng với các loại bệnh khác không
      if (name) {
        const nameExists = await DiseaseType.isNameExists(name, id);
        if (nameExists) {
          throw new ValidationError('Tên loại bệnh đã tồn tại');
        }
      }
      
      const diseaseType = await DiseaseType.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật loại bệnh thành công',
        data: diseaseType
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa loại bệnh
   * @route DELETE /api/disease-types/:id
   */
  static async deleteDiseaseType(req, res, next) {
    try {
      const { id } = req.params;
      await DiseaseType.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa loại bệnh thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy giới hạn số lượng loại bệnh
   * @route GET /api/disease-types/limits
   */
  static async getDiseaseTypeLimits(req, res, next) {
    try {
      const maxDiseaseTypes = await DiseaseType.getMaxDiseaseTypesCount();
      
      res.status(200).json({
        success: true,
        data: {
          maxDiseaseTypes
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DiseaseTypeController;
