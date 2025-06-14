const Staff = require('../models/staff.model');
const { ValidationError, NotFoundError } = require('../utils/apiError');
const { generateToken } = require('../utils/auth');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

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
  static async updateStaffPassword(req, res, next) {
    try {
      // Kiểm tra lỗi validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Dữ liệu không hợp lệ', errors.array());
      }
      
      const { id } = req.params;
      const { current_password, new_password } = req.body;
      
      // Kiểm tra mật khẩu hiện tại
      const staff = await Staff.verifyCredentials(req.user.username, current_password);
      
      if (!staff) {
        throw new ValidationError('Mật khẩu hiện tại không đúng');
      }
      
      // Cập nhật mật khẩu mới
      await Staff.updatePassword(id, new_password);
      
      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload avatar cho nhân viên
   * @route POST /api/staff/:id/avatar
   */
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('Vui lòng chọn ảnh đại diện');
      }

      const { id } = req.params;
      const staff = await Staff.findById(id);
      
      if (!staff) {
        // Xóa file vừa upload nếu không tìm thấy nhân viên
        fs.unlinkSync(req.file.path);
        throw new NotFoundError('Không tìm thấy nhân viên');
      }

      // Xóa ảnh cũ nếu có
      if (staff.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../public', staff.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Cập nhật đường dẫn ảnh mới
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      await Staff.update(id, { avatar: avatarPath });

      res.status(200).json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        data: { avatar: avatarPath }
      });
    } catch (error) {
      // Xóa file nếu có lỗi
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  /**
   * Đổi mật khẩu
   * @route POST /api/staff/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Gọi phương thức từ model để đổi mật khẩu
      await Staff.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tải lên ảnh đại diện cho nhân viên
   * @route POST /api/staff/:id/upload-avatar
   * @param {Object} req - Đối tượng request
   * @param {Object} res - Đối tượng response
   * @param {Function} next - Hàm next middleware
   */
  static async uploadAvatar(req, res, next) {
    try {
      const { id } = req.params;
      
      // Kiểm tra quyền truy cập - chỉ admin hoặc chính nhân viên đó mới được cập nhật
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        throw new Error('Bạn không có quyền thực hiện thao tác này');
      }

      // Kiểm tra nếu không có file
      if (!req.file) {
        throw new ValidationError('Vui lòng chọn ảnh đại diện');
      }

      // Tạo đường dẫn ảnh mới
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Cập nhật avatar trong database
      const updatedStaff = await Staff.update(id, { 
        avatar: avatarPath 
      });

      // Xóa ảnh cũ nếu không phải ảnh mặc định
      if (updatedStaff.oldAvatar && !updatedStaff.oldAvatar.includes('default-avatar')) {
        const oldAvatarPath = path.join(__dirname, '../../public', updatedStaff.oldAvatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Tạo URL đầy đủ cho avatar
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const avatarUrl = `${baseUrl}${avatarPath}`;

      res.status(200).json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        data: {
          id: parseInt(id),
          avatar: avatarPath,
          avatarUrl: avatarUrl
        }
      });
    } catch (error) {
      // Xóa file vừa upload nếu có lỗi
      if (req.file) {
        const filePath = path.join(__dirname, '../../public/uploads/avatars', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Chuyển tiếp lỗi cho middleware xử lý lỗi
      next(error);
    }
  }
}

module.exports = StaffController;
