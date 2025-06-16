const Permission = require('../models/permission.model');
const { ValidationError } = require('../utils/apiError');

/**
 * PermissionController
 * Xử lý các request liên quan đến quyền hạn
 */
class PermissionController {
  /**
   * Lấy danh sách quyền hạn
   * @route GET /api/permissions
   */
  static async getAllPermissions(req, res, next) {
    try {
      const { search, page, limit, groupBy } = req.query;
      const permissions = await Permission.findAll({ 
        search, 
        page, 
        limit, 
        groupBy: groupBy === 'true' 
      });
      
      res.status(200).json({
        success: true,
        ...permissions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy tất cả quyền hạn không phân trang
   * @route GET /api/permissions/all
   */
  static async getListAll(req, res, next) {
    try {
      const permissions = await Permission.getAllPermissions();
      
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin quyền hạn theo ID
   * @route GET /api/permissions/:id
   */
  static async getPermissionById(req, res, next) {
    try {
      const { id } = req.params;
      const permission = await Permission.findById(id);
      
      res.status(200).json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy danh sách vai trò có quyền hạn cụ thể
   * @route GET /api/permissions/:id/roles
   */
  static async getRolesWithPermission(req, res, next) {
    try {
      const { id } = req.params;
      const roles = await Permission.getRolesWithPermission(id);
      
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo quyền hạn mới
   * @route POST /api/permissions
   */
  static async createPermission(req, res, next) {
    try {
      const permission = await Permission.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo quyền hạn thành công',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật quyền hạn
   * @route PUT /api/permissions/:id
   */
  static async updatePermission(req, res, next) {
    try {
      const { id } = req.params;
      const permission = await Permission.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật quyền hạn thành công',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa quyền hạn
   * @route DELETE /api/permissions/:id
   */
  static async deletePermission(req, res, next) {
    try {
      const { id } = req.params;
      await Permission.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa quyền hạn thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PermissionController;
