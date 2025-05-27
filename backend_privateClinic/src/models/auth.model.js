const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/apiError');

/**
 * Auth Model
 * Quản lý xác thực và phân quyền người dùng
 */
class Auth {
  /**
   * Đăng nhập người dùng
   * @param {String} username - Tên đăng nhập
   * @param {String} password - Mật khẩu
   * @returns {Promise<Object>} Thông tin đăng nhập và token
   */
  static async login(username, password) {
    // Tìm kiếm người dùng theo username
    const userQuery = `
      SELECT 
        s.id, s.username, s.password, s.full_name, 
        s.email, s.role_id, s.is_active,
        r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.username = $1
    `;
    
    const { rows } = await db.query(userQuery, [username]);
    
    if (rows.length === 0) {
      throw new AuthenticationError('Thông tin đăng nhập không chính xác');
    }
    
    const user = rows[0];
    
    // Kiểm tra trạng thái tài khoản
    if (!user.is_active) {
      throw new AuthenticationError('Tài khoản đã bị vô hiệu hóa');
    }
    
    // Kiểm tra mật khẩu
    // Note: Trong database mẫu, mật khẩu lưu dưới dạng plain text, nhưng trong production nên dùng mật khẩu được hash
    // Ở đây tôi giả định mật khẩu đã được hash
    let passwordValid;
    
    try {
      // Thử kiểm tra với mật khẩu đã hash
      passwordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      // Nếu có lỗi, có thể mật khẩu đang lưu dưới dạng plain text (trong DB mẫu)
      passwordValid = password === user.password;
    }
    
    if (!passwordValid) {
      throw new AuthenticationError('Thông tin đăng nhập không chính xác');
    }
    
    // Lấy danh sách quyền của người dùng
    const permissionsQuery = `
      SELECT p.name 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    
    const permissionsResult = await db.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.name);
    
    // Cập nhật thời gian đăng nhập cuối
    await db.query(
      'UPDATE staff SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Trả về thông tin người dùng (không bao gồm mật khẩu) và token
    delete user.password;
    
    return {
      user: {
        ...user,
        permissions
      },
      token
    };
  }
  
  /**
   * Đổi mật khẩu người dùng
   * @param {Number} userId - ID của người dùng
   * @param {String} currentPassword - Mật khẩu hiện tại
   * @param {String} newPassword - Mật khẩu mới
   * @returns {Promise<Boolean>} Kết quả đổi mật khẩu
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Tìm kiếm người dùng theo ID
    const userQuery = 'SELECT id, password FROM staff WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    
    if (rows.length === 0) {
      throw new AuthenticationError('Người dùng không tồn tại');
    }
    
    const user = rows[0];
    
    // Kiểm tra mật khẩu hiện tại
    let passwordValid;
    
    try {
      // Thử kiểm tra với mật khẩu đã hash
      passwordValid = await bcrypt.compare(currentPassword, user.password);
    } catch (error) {
      // Nếu có lỗi, có thể mật khẩu đang lưu dưới dạng plain text (trong DB mẫu)
      passwordValid = currentPassword === user.password;
    }
    
    if (!passwordValid) {
      throw new AuthenticationError('Mật khẩu hiện tại không chính xác');
    }
    
    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu mới
    await db.query(
      'UPDATE staff SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    return true;
  }
  
  /**
   * Lấy thông tin người dùng hiện tại
   * @param {Number} userId - ID của người dùng
   * @returns {Promise<Object>} Thông tin người dùng
   */
  static async getCurrentUser(userId) {
    const userQuery = `
      SELECT 
        s.id, s.username, s.full_name, s.email, s.phone,
        s.role_id, s.is_active, s.last_login,
        r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.id = $1
    `;
    
    const { rows } = await db.query(userQuery, [userId]);
    
    if (rows.length === 0) {
      throw new AuthenticationError('Người dùng không tồn tại');
    }
    
    const user = rows[0];
    
    // Lấy danh sách quyền của người dùng
    const permissionsQuery = `
      SELECT p.name 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    
    const permissionsResult = await db.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.name);
    
    return {
      ...user,
      permissions
    };
  }
}

module.exports = Auth;
