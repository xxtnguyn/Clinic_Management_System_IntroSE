const db = require('../config/db');
const bcrypt = require('bcrypt');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/apiError');

/**
 * Staff Model
 * Quản lý thao tác với bảng staff (nhân viên y tế)
 */
class Staff {
  /**
   * Lấy danh sách tất cả nhân viên
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách nhân viên
   */
  static async findAll(options = {}) {
    const { 
      search = '', 
      page = 1, 
      limit = 10, 
      roleId = null,
      isActive = null 
    } = options;
    
    const offset = (page - 1) * limit;
    const queryParams = [];
    let paramCount = 1;
    
    // Xây dựng câu truy vấn cơ bản
    let query = `
      SELECT 
        s.id, s.username, s.full_name, s.email, s.phone, s.address, 
        s.is_active, s.created_at, s.updated_at,
        r.id as role_id, r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE 1=1
    `;
    
    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (
        s.full_name ILIKE $${paramCount} OR
        s.username ILIKE $${paramCount} OR
        s.email ILIKE $${paramCount} OR
        s.phone ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    // Lọc theo roleId
    if (roleId) {
      query += ` AND s.role_id = $${paramCount}`;
      queryParams.push(roleId);
      paramCount++;
    }
    
    // Lọc theo trạng thái hoạt động
    if (isActive !== null) {
      query += ` AND s.is_active = $${paramCount}`;
      queryParams.push(isActive);
      paramCount++;
    }
    
    // Đếm tổng số nhân viên phù hợp với điều kiện lọc
    const countQuery = query.replace(
      'SELECT s.id, s.username, s.full_name, s.email, s.phone, s.address, s.is_active, s.created_at, s.updated_at, r.id as role_id, r.name as role_name',
      'SELECT COUNT(*)'
    );
    
    // Thêm sắp xếp và phân trang
    query += ` ORDER BY s.full_name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);
    
    // Thực hiện truy vấn
    const { rows } = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, queryParams.slice(0, paramCount - 1));
    const total = parseInt(countResult.rows[0].count);
    
    // Định dạng lại dữ liệu trả về
    const staffList = rows.map(row => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      isActive: row.is_active,
      role: {
        id: row.role_id,
        name: row.role_name
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return {
      data: staffList,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Tìm nhân viên theo ID
   * @param {Number} id - ID của nhân viên
   * @param {Boolean} includePassword - Có bao gồm mật khẩu hay không
   * @returns {Promise<Object>} Thông tin nhân viên
   */
  static async findById(id, includePassword = false) {
    const query = `
      SELECT 
        s.id, s.username, s.full_name, s.email, s.phone, s.address, 
        ${includePassword ? 's.password,' : ''}
        s.is_active, s.created_at, s.updated_at,
        r.id as role_id, r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy nhân viên');
    }
    
    const staff = rows[0];
    
    return {
      id: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      ...(includePassword && { password: staff.password }),
      isActive: staff.is_active,
      role: {
        id: staff.role_id,
        name: staff.role_name
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };
  }
  
  /**
   * Tìm nhân viên theo username
   * @param {String} username - Tên đăng nhập
   * @param {Boolean} includePassword - Có bao gồm mật khẩu hay không
   * @returns {Promise<Object>} Thông tin nhân viên
   */
  static async findByUsername(username, includePassword = false) {
    const query = `
      SELECT 
        s.id, s.username, s.full_name, s.email, s.phone, s.address, 
        ${includePassword ? 's.password,' : ''}
        s.is_active, s.created_at, s.updated_at,
        r.id as role_id, r.name as role_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.username = $1
    `;
    
    const { rows } = await db.query(query, [username]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy nhân viên');
    }
    
    const staff = rows[0];
    
    return {
      id: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      ...(includePassword && { password: staff.password }),
      isActive: staff.is_active,
      role: {
        id: staff.role_id,
        name: staff.role_name
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };
  }
  
  /**
   * Tạo nhân viên mới
   * @param {Object} data - Dữ liệu nhân viên
   * @returns {Promise<Object>} Nhân viên mới tạo
   */
  static async create(data) {
    try {
      const { 
        username, 
        fullName, 
        email, 
        phone, 
        address, 
        password, 
        roleId,
        isActive = true 
      } = data;
      
      // Hash mật khẩu nếu có
      let hashedPassword = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }
      
      const query = `
        INSERT INTO staff (
          username, full_name, email, phone, address, password, role_id, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, full_name, email, phone, address, is_active, role_id, created_at, updated_at
      `;
      
      const values = [
        username,
        fullName,
        email,
        phone,
        address,
        hashedPassword,
        roleId,
        isActive
      ];
      
      const { rows } = await db.query(query, values);
      
      // Lấy thông tin role
      const roleQuery = 'SELECT id, name FROM roles WHERE id = $1';
      const roleResult = await db.query(roleQuery, [roleId]);
      
      return {
        id: rows[0].id,
        username: rows[0].username,
        fullName: rows[0].full_name,
        email: rows[0].email,
        phone: rows[0].phone,
        address: rows[0].address,
        isActive: rows[0].is_active,
        role: {
          id: roleResult.rows[0].id,
          name: roleResult.rows[0].name
        },
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
    } catch (error) {
      // Lỗi unique constraint (username trùng)
      if (error.code === '23505' && error.constraint === 'staff_username_key') {
        throw new ConflictError(
          'Tên đăng nhập đã tồn tại',
          'Vui lòng chọn tên đăng nhập khác'
        );
      }
      
      // Lỗi unique constraint (email trùng)
      if (error.code === '23505' && error.constraint === 'staff_email_key') {
        throw new ConflictError(
          'Email đã tồn tại',
          'Vui lòng sử dụng email khác'
        );
      }
      
      // Lỗi unique constraint (phone trùng)
      if (error.code === '23505' && error.constraint === 'staff_phone_key') {
        throw new ConflictError(
          'Số điện thoại đã tồn tại',
          'Vui lòng sử dụng số điện thoại khác'
        );
      }
      
      // Lỗi foreign key (roleId không tồn tại)
      if (error.code === '23503' && error.constraint === 'staff_role_id_fkey') {
        throw new NotFoundError('Vai trò không tồn tại');
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin nhân viên
   * @param {Number} id - ID của nhân viên
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Nhân viên sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra nhân viên tồn tại
    await this.findById(id);
    
    const { 
      username, 
      fullName, 
      email, 
      phone, 
      address, 
      password, 
      roleId,
      isActive 
    } = data;
    
    // Chuẩn bị dữ liệu cập nhật
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (username !== undefined) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    
    if (fullName !== undefined) {
      updateFields.push(`full_name = $${paramCount}`);
      values.push(fullName);
      paramCount++;
    }
    
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }
    
    if (address !== undefined) {
      updateFields.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }
    
    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }
    
    if (roleId !== undefined) {
      updateFields.push(`role_id = $${paramCount}`);
      values.push(roleId);
      paramCount++;
    }
    
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }
    
    // Nếu không có dữ liệu cập nhật
    if (updateFields.length === 0) {
      return this.findById(id);
    }
    
    try {
      // Thêm ID vào cuối mảng values
      values.push(id);
      
      const query = `
        UPDATE staff
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, full_name, email, phone, address, is_active, role_id, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, values);
      
      // Lấy thông tin role
      const roleQuery = 'SELECT id, name FROM roles WHERE id = $1';
      const roleResult = await db.query(roleQuery, [rows[0].role_id]);
      
      return {
        id: rows[0].id,
        username: rows[0].username,
        fullName: rows[0].full_name,
        email: rows[0].email,
        phone: rows[0].phone,
        address: rows[0].address,
        isActive: rows[0].is_active,
        role: {
          id: roleResult.rows[0].id,
          name: roleResult.rows[0].name
        },
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
    } catch (error) {
      // Lỗi unique constraint (username trùng)
      if (error.code === '23505' && error.constraint === 'staff_username_key') {
        throw new ConflictError(
          'Tên đăng nhập đã tồn tại',
          'Vui lòng chọn tên đăng nhập khác'
        );
      }
      
      // Lỗi unique constraint (email trùng)
      if (error.code === '23505' && error.constraint === 'staff_email_key') {
        throw new ConflictError(
          'Email đã tồn tại',
          'Vui lòng sử dụng email khác'
        );
      }
      
      // Lỗi unique constraint (phone trùng)
      if (error.code === '23505' && error.constraint === 'staff_phone_key') {
        throw new ConflictError(
          'Số điện thoại đã tồn tại',
          'Vui lòng sử dụng số điện thoại khác'
        );
      }
      
      // Lỗi foreign key (roleId không tồn tại)
      if (error.code === '23503' && error.constraint === 'staff_role_id_fkey') {
        throw new NotFoundError('Vai trò không tồn tại');
      }
      
      throw error;
    }
  }
  
  /**
   * Thay đổi mật khẩu nhân viên
   * @param {Number} id - ID của nhân viên
   * @param {String} currentPassword - Mật khẩu hiện tại
   * @param {String} newPassword - Mật khẩu mới
   * @returns {Promise<Boolean>} Kết quả thay đổi mật khẩu
   * @throws {ValidationError} Nếu mật khẩu hiện tại không đúng
   */
  static async changePassword(id, currentPassword, newPassword) {
    // Lấy thông tin nhân viên kèm mật khẩu
    const staff = await this.findById(id, true);
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, staff.password);
    if (!isMatch) {
      throw new ValidationError('Mật khẩu hiện tại không đúng');
    }
    
    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Cập nhật mật khẩu mới
    const query = 'UPDATE staff SET password = $1, updated_at = NOW() WHERE id = $2';
    await db.query(query, [hashedPassword, id]);
    
    return true;
  }
  
  /**
   * Thay đổi trạng thái hoạt động của nhân viên
   * @param {Number} id - ID của nhân viên
   * @param {Boolean} isActive - Trạng thái hoạt động mới
   * @returns {Promise<Object>} Nhân viên sau khi cập nhật
   */
  static async changeStatus(id, isActive) {
    // Kiểm tra nhân viên tồn tại
    await this.findById(id);
    
    const query = `
      UPDATE staff SET is_active = $1 WHERE id = $2
      RETURNING id, username, full_name, email, phone, address, is_active, role_id, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [isActive, id]);
    
    // Lấy thông tin role
    const roleQuery = 'SELECT id, name FROM roles WHERE id = $1';
    const roleResult = await db.query(roleQuery, [rows[0].role_id]);
    
    return {
      id: rows[0].id,
      username: rows[0].username,
      fullName: rows[0].full_name,
      email: rows[0].email,
      phone: rows[0].phone,
      address: rows[0].address,
      isActive: rows[0].is_active,
      role: {
        id: roleResult.rows[0].id,
        name: roleResult.rows[0].name
      },
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at
    };
  }
  
  /**
   * Xóa nhân viên
   * @param {Number} id - ID của nhân viên
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra nhân viên tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM staff WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new DatabaseError(
          'Không thể xóa nhân viên này vì đã có dữ liệu liên quan',
          'Nhân viên đã được liên kết với các bản ghi khác',
          'Vui lòng vô hiệu hóa tài khoản thay vì xóa'
        );
      }
      throw error;
    }
  }

  /**
   * Kiểm tra username đã tồn tại chưa
   * @param {String} username - Username cần kiểm tra
   * @param {Number} [excludeId=null] - ID nhân viên cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isUsernameExists(username, excludeId = null) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM staff 
        WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [username];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   * @param {String} email - Email cần kiểm tra
   * @param {Number} [excludeId=null] - ID nhân viên cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isEmailExists(email, excludeId = null) {
    if (!email) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM staff 
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [email];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Kiểm tra số điện thoại đã tồn tại chưa
   * @param {String} phone - Số điện thoại cần kiểm tra
   * @param {Number} [excludeId=null] - ID nhân viên cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isPhoneExists(phone, excludeId = null) {
    if (!phone) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM staff 
        WHERE phone = $1
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [phone];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Kiểm tra trùng lặp
   * @param {String} field - Trường cần kiểm tra
   * @param {String} value - Giá trị cần kiểm tra
   * @param {Number} [excludeId=null] - ID nhân viên cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isExists(field, value, excludeId = null) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM staff 
        WHERE ${field} = $1
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [value];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }
}

module.exports = Staff;
