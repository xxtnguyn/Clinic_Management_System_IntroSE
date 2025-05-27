const Staff = require('../models/staff.model');
const { ValidationError } = require('../utils/apiError');
const { generateToken } = require('../utils/auth');
const { validationResult } = require('express-validator');

/**
 * StaffController
 * Xử lý các request liên quan đến nhân viên
 */
class StaffController {
  /**
   * Lấy danh sách nhân viên
   * @route GET /api/staff
   */
  static async getAllStaff(req, res, next) {
    try {
      const { search, page = 1, limit = 10, roleId, isActive } = req.query;
      
      const result = await Staff.findAll({
        search,
        page: parseInt(page),
        limit: parseInt(limit),
        roleId: roleId ? parseInt(roleId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
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
   * Lấy thông tin chi tiết nhân viên
   * @route GET /api/staff/:id
   */
  static async getStaffById(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await Staff.findById(id);
      
      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo nhân viên mới
   * @route POST /api/staff
   */
  static async createStaff(req, res, next) {
    try {
      // Kiểm tra lỗi validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Dữ liệu không hợp lệ', errors.array());
      }
      
      const staff = await Staff.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo nhân viên thành công',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật thông tin nhân viên
   * @route PUT /api/staff/:id
   */
  static async updateStaff(req, res, next) {
    try {
      // Kiểm tra lỗi validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Dữ liệu không hợp lệ', errors.array());
      }
      
      const { id } = req.params;
      const staff = await Staff.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Xóa nhân viên
   * @route DELETE /api/staff/:id
   */
  static async deleteStaff(req, res, next) {
    try {
      const { id } = req.params;
      await Staff.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa nhân viên thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Đăng nhập nhân viên
   * @route POST /api/staff/login
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      // Kiểm tra thông tin đăng nhập
      const staff = await Staff.authenticate(username, password);
      
      if (!staff) {
        throw new ValidationError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
      
      // Tạo token
      const token = generateToken({
        id: staff.id,
        username: staff.username,
        role: staff.role
      });
      
      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: {
            id: staff.id,
            username: staff.username,
            fullName: staff.full_name,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
            isActive: staff.is_active
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Đổi mật khẩu
   * @route POST /api/staff/change-password
   * @description Cho phép nhân viên đổi mật khẩu của chính họ
   * @body {string} current_password - Mật khẩu hiện tại
   * @body {string} new_password - Mật khẩu mới
   * @body {string} confirm_password - Xác nhận mật khẩu mới
   */
  static async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      
      // Lấy ID của nhân viên từ token đã xác thực
      const staffId = req.user.id;
      
      // Gọi model để xử lý đổi mật khẩu
      await Staff.changePassword(staffId, current_password, new_password);
      
      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin nhân viên hiện tại
   * @route GET /api/staff/me
   */
  static async getCurrentStaff(req, res, next) {
    try {
      const staff = await Staff.findById(req.user.id);
      
      if (!staff) {
        throw new ValidationError('Không tìm thấy thông tin nhân viên');
      }
      
      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StaffController;
