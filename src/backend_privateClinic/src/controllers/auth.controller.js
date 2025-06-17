const Auth = require('../models/auth.model');
const { ValidationError } = require('../utils/apiError');
const { forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schema');
const nodemailer = require('nodemailer');

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

  /**
   * Yêu cầu đặt lại mật khẩu
   * @route POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      // Validate input
      const { error } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { email } = req.body;

      // Gửi email đặt lại mật khẩu
      await Auth.requestPasswordReset(email);

      // Luôn trả về thành công để tránh lộ thông tin
      res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đặt lại mật khẩu với token
   * @route POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      // Validate input
      const { error } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { token, password } = req.body;

      // Thực hiện đặt lại mật khẩu
      await Auth.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @route POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      // Validate input
      const { error } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { email } = req.body;

      // Gọi model để xử lý yêu cầu đặt lại mật khẩu
      await Auth.requestPasswordReset(email);

      // Luôn trả về thành công để tránh lộ thông tin email có tồn tại hay không
      res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đặt lại mật khẩu
   * @route POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      // Validate input
      const { error } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { token, password } = req.body;

      // Gọi model để xử lý đặt lại mật khẩu
      await Auth.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
