const UsageInstruction = require('../models/usageInstruction.model');
const { ValidationError } = require('../utils/apiError');

/**
 * UsageInstructionController
 * Xử lý các request liên quan đến cách dùng thuốc
 */
class UsageInstructionController {
  /**
   * Lấy danh sách cách dùng thuốc
   * @route GET /api/usage-instructions
   */
  static async getAllUsageInstructions(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const usageInstructions = await UsageInstruction.findAll({ search, page, limit });
      
      res.status(200).json({
        success: true,
        ...usageInstructions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin cách dùng thuốc theo ID
   * @route GET /api/usage-instructions/:id
   */
  static async getUsageInstructionById(req, res, next) {
    try {
      const { id } = req.params;
      const usageInstruction = await UsageInstruction.findById(id);
      
      res.status(200).json({
        success: true,
        data: usageInstruction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo cách dùng thuốc mới
   * @route POST /api/usage-instructions
   */
  static async createUsageInstruction(req, res, next) {
    try {
      const usageInstruction = await UsageInstruction.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo cách dùng thuốc thành công',
        data: usageInstruction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật cách dùng thuốc
   * @route PUT /api/usage-instructions/:id
   */
  static async updateUsageInstruction(req, res, next) {
    try {
      const { id } = req.params;
      const usageInstruction = await UsageInstruction.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật cách dùng thuốc thành công',
        data: usageInstruction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa cách dùng thuốc
   * @route DELETE /api/usage-instructions/:id
   */
  static async deleteUsageInstruction(req, res, next) {
    try {
      const { id } = req.params;
      await UsageInstruction.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa cách dùng thuốc thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy giới hạn số lượng cách dùng thuốc
   * @route GET /api/usage-instructions/limits
   */
  static async getUsageInstructionLimits(req, res, next) {
    try {
      const maxUsageInstructions = await UsageInstruction.getMaxUsageInstructionsCount();
      
      res.status(200).json({
        success: true,
        data: {
          maxUsageInstructions
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsageInstructionController;
