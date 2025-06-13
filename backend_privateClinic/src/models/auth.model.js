const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { AuthenticationError, ValidationError } = require('../utils/apiError');
const crypto = require('crypto');

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
        s.role_id, s.is_active, s.last_login, s.address,
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

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param {String} email - Email của người dùng
   * @returns {Promise<Object>} Kết quả yêu cầu
   */
  static async requestPasswordReset(email) {
    // 1. Tìm user bằng email
    const userQuery = `
      SELECT id, full_name, email 
      FROM staff 
      WHERE email = $1 AND is_active = TRUE
    `;
    
    const { rows } = await db.query(userQuery, [email]);
    
    if (rows.length === 0) {
      // Không thông báo lỗi để tránh lộ thông tin
      return { success: true };
    }
    
    const user = rows[0];
    
    // 2. Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Hết hạn sau 1 giờ
    
    // 3. Lưu token vào database
    await db.query(
      `INSERT INTO password_reset_tokens 
       (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );
    
    // 4. In ra console cho mục đích phát triển
    // Trong môi trường production, nên gửi email thật
    console.log(`\n=== RESET PASSWORD LINK ===`);
    console.log(`Email: ${user.email}`);
    console.log(`Token: ${token}`);
    console.log(`Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
    console.log('==========================\n');
    
    return { success: true };
  }
  
  /**
   * Đặt lại mật khẩu
   * @param {String} token - Token đặt lại mật khẩu
   * @param {String} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} Kết quả đặt lại mật khẩu
   */
  static async resetPassword(token, newPassword) {
    // 1. Tìm token hợp lệ
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 
      AND used = FALSE 
      AND expires_at > NOW()
      FOR UPDATE
    `;
    
    // Bắt đầu transaction
    await db.query('BEGIN');
    
    try {
      const { rows } = await db.query(tokenQuery, [token]);
      
      if (rows.length === 0) {
        throw new ValidationError('Token không hợp lệ hoặc đã hết hạn');
      }
      
      const resetToken = rows[0];
      
      // 2. Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 3. Cập nhật mật khẩu
      await db.query(
        'UPDATE staff SET password = $1 WHERE id = $2',
        [hashedPassword, resetToken.user_id]
      );
      
      // 4. Đánh dấu token đã sử dụng
      await db.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
        [resetToken.id]
      );
      
      // Commit transaction nếu mọi thứ thành công
      await db.query('COMMIT');
      
      return { success: true };
    } catch (error) {
      // Rollback nếu có lỗi
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param {String} email - Email của người dùng
   * @returns {Promise<Object>} Kết quả yêu cầu
   */
  static async requestPasswordReset(email) {
    // 1. Tìm user bằng email
    const userQuery = `
      SELECT id, full_name, email 
      FROM staff 
      WHERE email = $1 AND is_active = TRUE
    `;
    
    const { rows } = await db.query(userQuery, [email]);
    
    if (rows.length === 0) {
      // Không thông báo lỗi để tránh lộ thông tin
      return { success: true };
    }
    
    const user = rows[0];
    
    // 2. Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Hết hạn sau 1 giờ
    
    // 3. Lưu token vào database
    await db.query(
      `INSERT INTO password_reset_tokens 
       (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );
    
    // 4. Gửi email đặt lại mật khẩu
    await this.sendResetPasswordEmail(user.email, token, user.full_name || 'Quý khách');
    
    return { success: true };
  }

  // Gửi email đặt lại mật khẩu
  static async sendResetPasswordEmail(email, token, userName) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      // Tạo transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // Tùy chọn email
      const mailOptions = {
        from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Đặt lại mật khẩu tài khoản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4a90e2; color: white; padding: 20px; text-align: center;">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div style="padding: 25px; background-color: #ffffff;">
              <p>Xin chào <strong>${userName}</strong>,</p>
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; padding: 12px 24px; 
                          background-color: #4a90e2; color: white; 
                          text-decoration: none; border-radius: 4px;
                          font-weight: bold;">
                  Đặt lại mật khẩu
                </a>
              </div>
              <p>Hoặc sao chép và dán đường dẫn sau vào trình duyệt:</p>
              <p style="word-break: break-all; color: #4a90e2; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${resetLink}
              </p>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <p>Liên kết này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
              <p>Trân trọng,<br><strong>${process.env.APP_NAME}</strong></p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #e0e0e0;">
              <p>Đây là email tự động, vui lòng không trả lời email này.</p>
            </div>
          </div>
        `,
      };

      // Gửi email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      
    } catch (error) {
      console.error('Error sending email:', error);
      // Không throw error để không làm lộ thông tin lỗi cho người dùng
    }
  }

  /**
   * Đặt lại mật khẩu
   * @param {String} token - Token đặt lại mật khẩu
   * @param {String} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} Kết quả đặt lại mật khẩu
   */
  static async resetPassword(token, newPassword) {
    // 1. Tìm token hợp lệ
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 
      AND used = FALSE 
      AND expires_at > NOW()
      FOR UPDATE
    `;
    
    // Bắt đầu transaction
    await db.query('BEGIN');
    
    try {
      const { rows } = await db.query(tokenQuery, [token]);
      
      if (rows.length === 0) {
        throw new ValidationError('Token không hợp lệ hoặc đã hết hạn');
      }
      
      const resetToken = rows[0];
      
      // 2. Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 3. Cập nhật mật khẩu
      await db.query(
        'UPDATE staff SET password = $1 WHERE id = $2',
        [hashedPassword, resetToken.user_id]
      );
      
      // 4. Đánh dấu token đã sử dụng
      await db.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
        [resetToken.id]
      );
      
      // Commit transaction nếu mọi thứ thành công
      await db.query('COMMIT');
      
      return { success: true };
    } catch (error) {
      // Rollback nếu có lỗi
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Lấy thông tin người dùng hiện tại
   * @param {Number} userId - ID của người dùng
   * @returns {Promise<Object>} Thông tin người dùng
   */
  static async getCurrentUser(userId) {
    const query = `
      SELECT 
        s.id, s.username, s.full_name, s.email, s.phone, s.address, 
        s.gender, s.birth_date, s.avatar, s.is_active,
        s.role_id, r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.id = $1
    `;
    
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      throw new Error('Người dùng không tồn tại');
    }
    
    const user = rows[0];
    
    // Định dạng lại dữ liệu trả về
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      birthDate: user.birth_date,
      avatar: user.avatar,
      isActive: user.is_active,
      role: {
        id: user.role_id,
        name: user.role_name
      }
    };
  }
}

module.exports = Auth;
