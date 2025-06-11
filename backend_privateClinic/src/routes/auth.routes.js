const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { authSchema } = require('../schemas');
const { 
  loginSchema, 
  changePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} = authSchema;
const validate = require('../middlewares/validation.middleware');

const router = express.Router();

// Route: POST /api/auth/login
// Mô tả: Đăng nhập hệ thống
// Quyền: Không yêu cầu xác thực
router.post(
  '/login',
  validate(loginSchema),
  AuthController.login
);

// Route: GET /api/auth/me
// Mô tả: Lấy thông tin người dùng hiện tại
// Quyền: Yêu cầu đã đăng nhập
router.get(
  '/me',
  authenticate,
  AuthController.getCurrentUser
);

// Route: POST /api/auth/change-password
// Mô tả: Đổi mật khẩu người dùng
// Quyền: Yêu cầu đã đăng nhập
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

// Route: POST /api/auth/forgot-password
// Mô tả: Yêu cầu đặt lại mật khẩu
// Quyền: Không yêu cầu xác thực
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

// Route: POST /api/auth/reset-password
// Mô tả: Đặt lại mật khẩu với token
// Quyền: Không yêu cầu xác thực
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

// Route: POST /api/auth/reset-password
// Mô tả: Đặt lại mật khẩu với token
// Quyền: Không yêu cầu xác thực
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

module.exports = router;
