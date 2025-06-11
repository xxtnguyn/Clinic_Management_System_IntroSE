const Role = require('../models/role.model');
const { ValidationError } = require('../utils/apiError');

/**
 * RoleController
 * Xử lý các request liên quan đến vai trò
 */
class RoleController {
  /**
   * Lấy danh sách vai trò
   * @route GET /api/roles
   */
  static async getAllRoles(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const roles = await Role.findAll({ search, page, limit });
      
      res.status(200).json({
        success: true,
        ...roles
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy tất cả vai trò không phân trang
   * @route GET /api/roles/all
   */
  static async getListAll(req, res, next) {
    try {
      const roles = await Role.getAllRoles();
      
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin vai trò theo ID
   * @route GET /api/roles/:id
   */
  static async getRoleById(req, res, next) {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin vai trò kèm quyền hạn
   * @route GET /api/roles/:id/permissions
   */
  static async getRoleWithPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const role = await Role.findByIdWithPermissions(id);
      
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo vai trò mới
   * @route POST /api/roles
   */
  static async createRole(req, res, next) {
    try {
      const role = await Role.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo vai trò thành công',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật vai trò
   * @route PUT /api/roles/:id
   */
  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const role = await Role.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật vai trò thành công',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa vai trò
   * @route DELETE /api/roles/:id
   */
  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      await Role.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa vai trò thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Thêm quyền cho vai trò
   * @route POST /api/roles/:id/permissions
   */
  static async addPermission(req, res, next) {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;
      
      if (!permissionId) {
        throw new ValidationError('ID quyền là bắt buộc');
      }
      
      await Role.addPermission(id, permissionId);
      
      // Lấy thông tin vai trò sau khi cập nhật
      const role = await Role.findByIdWithPermissions(id);
      
      res.status(200).json({
        success: true,
        message: 'Thêm quyền cho vai trò thành công',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa quyền khỏi vai trò
   * @route DELETE /api/roles/:id/permissions/:permissionId
   */
  static async removePermission(req, res, next) {
    try {
      const { id, permissionId } = req.params;
      
      await Role.removePermission(id, permissionId);
      
      // Lấy thông tin vai trò sau khi cập nhật
      const role = await Role.findByIdWithPermissions(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa quyền khỏi vai trò thành công',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RoleController;
