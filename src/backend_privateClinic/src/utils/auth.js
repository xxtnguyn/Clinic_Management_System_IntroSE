const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { config } = require('../config');
const { UnauthorizedError } = require('./apiError');

// Hằng số
const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

/**
 * Tạo JWT token
 * @param {Object} payload - Dữ liệu cần mã hóa vào token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: TOKEN_EXPIRES_IN
  });
};

/**
 * Xác thực JWT token
 * @param {string} token - JWT token cần xác thực
 * @returns {Object} Giải mã token
 * @throws {UnauthorizedError} Nếu token không hợp lệ
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn');
  }
};

/**
 * Mã hóa mật khẩu
 * @param {string} password - Mật khẩu cần mã hóa
 * @returns {Promise<string>} Mật khẩu đã được mã hóa
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * So sánh mật khẩu
 * @param {string} password - Mật khẩu gốc
 * @param {string} hashedPassword - Mật khẩu đã mã hóa
 * @returns {Promise<boolean>} Kết quả so sánh
 */
const comparePasswords = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Middleware xác thực người dùng
 * @param {Object} req - Đối tượng request
 * @param {Object} res - Đối tượng response
 * @param {Function} next - Hàm next
 */
const authenticate = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Không tìm thấy token xác thực');
    }

    const token = authHeader.split(' ')[1];
    
    // Xác thực token
    const decoded = verifyToken(token);
    
    // Lưu thông tin người dùng vào request
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware phân quyền
 * @param {string[]} allowedRoles - Danh sách quyền được phép
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Yêu cầu xác thực');
      }

      // Nếu không chỉ định quyền, mặc định cho phép
      if (!allowedRoles || allowedRoles.length === 0) {
        return next();
      }

      // Kiểm tra người dùng có quyền truy cập không
      const hasPermission = allowedRoles.some(role => 
        req.user.role === role || 
        (Array.isArray(req.user.roles) && req.user.roles.includes(role))
      );

      if (!hasPermission) {
        throw new UnauthorizedError('Không có quyền thực hiện hành động này');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePasswords,
  authenticate,
  authorize
};
