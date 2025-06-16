const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Middleware xác thực người dùng
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Không tìm thấy token xác thực' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra user có tồn tại và đang active
    const { rows } = await db.query(
      'SELECT s.id, s.username, s.role_id, s.is_active, r.name as role_name FROM staff s JOIN roles r ON s.role_id = r.id WHERE s.id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Người dùng không tồn tại' 
      });
    }

    const user = rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Tài khoản đã bị vô hiệu hóa' 
      });
    }

    // Thêm thông tin user vào request
    req.user = {
      id: user.id,
      username: user.username,
      roleId: user.role_id,
      roleName: user.role_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token không hợp lệ' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token đã hết hạn' 
      });
    }
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền
 * @param {Array} permissions - Mảng các quyền cần kiểm tra
 */
const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      const { id, roleName } = req.user;
      
      // Nếu là admin thì cho phép tất cả
      if (roleName === 'admin') {
        return next();
      }
      
      // Kiểm tra người dùng có các quyền cần thiết không
      const { rows } = await db.query(
        `SELECT p.name 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         JOIN roles r ON rp.role_id = r.id 
         WHERE r.id = (SELECT role_id FROM staff WHERE id = $1) 
         AND p.name = ANY($2)`,
        [id, permissions]
      );
      
      // Nếu không có quyền nào thì từ chối
      if (rows.length === 0) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Bạn không có quyền thực hiện hành động này' 
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize
};
