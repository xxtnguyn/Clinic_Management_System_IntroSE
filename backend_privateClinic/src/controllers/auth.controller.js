const Auth = require('../models/auth.model');
const { ValidationError } = require('../utils/apiError');

/**
 * AuthController
 * Xử lý các request liên quan đến xác thực người dùng
 */
class AuthController {
  /**
   * Đăng nhập hệ thống
   * @route POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const authResult = await Auth.login(username, password);
      
      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        ...authResult
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin người dùng hiện tại
   * @route GET /api/auth/me
   */
  static async getCurrentUser(req, res, next) {
    try {
      const user = await Auth.getCurrentUser(req.user.id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Đổi mật khẩu người dùng
   * @route POST /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await Auth.changePassword(req.user.id, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
