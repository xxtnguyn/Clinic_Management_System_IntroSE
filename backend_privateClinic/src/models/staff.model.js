const db = require('../config/db');
const bcrypt = require('bcrypt');
const path = require('path');
const { 
  NotFoundError, 
  ConflictError, 
  DatabaseError, 
  ValidationError 
} = require('../utils/apiError');

// Constants
const AVATAR_BASE_PATH = '/uploads/avatars/';
const DEFAULT_AVATAR = 'default-avatar.png';
const VALID_GENDERS = ['Nam', 'Nữ', 'Khác'];

/**
 * Format avatar path
 * @param {string} avatar - Avatar filename or full path
 * @returns {string} Full avatar path
 */
function formatAvatarPath(avatar) {
  if (!avatar) {
    // Use string concatenation with forward slashes for consistent path format
    const defaultPath = `${AVATAR_BASE_PATH}${DEFAULT_AVATAR}`.replace(/\\/g, '/');
    return defaultPath;
  }
  if (avatar.startsWith('http')) return avatar;
  
  // Convert any backslashes to forward slashes for consistency
  if (path.isAbsolute(avatar)) {
    return avatar.replace(/\\/g, '/');
  }
  
  // Join paths and ensure forward slashes
  const fullPath = `${AVATAR_BASE_PATH}${avatar}`.replace(/\\/g, '/');
  return fullPath;
}

/**
 * Staff Model
 * Handles database operations for staff members
 */
class Staff {
  /**
   * Create a new staff member
   * @param {Object} data - Staff data
   * @returns {Promise<Object>} Created staff member
   */
  static async create(data) {
    try {
      // Validate input data
      this.validateStaffData(data);
      
      // Check for duplicates
      await this.checkForDuplicates(data);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Prepare staff data
      const staffData = {
        username: data.username,
        full_name: data.fullName || data.full_name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        password: hashedPassword,
        role_id: data.roleId || data.role_id,
        gender: this.normalizeGender(data.gender),
        birth_date: data.birthDate || data.birth_date,
        avatar: data.avatar ? formatAvatarPath(data.avatar) : null,
        is_active: data.isActive !== undefined ? data.isActive : true
      };
      
      // Insert into database
      const query = `
        INSERT INTO staff (
          username, full_name, email, phone, address, 
          password, role_id, gender, birth_date, avatar, is_active
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        staffData.username,
        staffData.full_name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.password,
        staffData.role_id,
        staffData.gender,
        staffData.birth_date,
        staffData.avatar,
        staffData.is_active
      ];
      
      const { rows } = await db.query(query, values);
      return this.formatStaffResponse(rows[0]);
      
    } catch (error) {
      console.error('Error creating staff member:', error);
      
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error.code === '23505') { // Unique violation
        if (error.constraint?.includes('email')) {
          throw new ConflictError('Email đã được sử dụng');
        } else if (error.constraint?.includes('phone')) {
          throw new ConflictError('Số điện thoại đã được sử dụng');
        } else if (error.constraint?.includes('username')) {
          throw new ConflictError('Tên đăng nhập đã được sử dụng');
        }
      }
      
      throw new DatabaseError('Lỗi khi tạo nhân viên mới');
    }
  }

  /**
   * Find staff by ID
   * @param {number} id - Staff ID
   * @param {boolean} includePassword - Whether to include password in response
   * @returns {Promise<Object>} Staff information
   */
  static async findById(id, includePassword = false) {
    try {
      const query = `
        SELECT 
          s.*,
          r.id as role_id, 
          r.name as role_name
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE s.id = $1
      `;
      
      const { rows } = await db.query(query, [id]);
      
      if (rows.length === 0) {
        throw new NotFoundError('Không tìm thấy nhân viên');
      }
      
      return this.formatStaffResponse(rows[0], includePassword);
      
    } catch (error) {
      console.error(`Error finding staff with ID ${id}:`, error);
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Lỗi khi lấy thông tin nhân viên');
    }
  }

  /**
   * Update staff information
   * @param {number} id - Staff ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated staff information
   */
  static async update(id, data) {
    try {
      // Get current staff data
      const currentStaff = await this.findById(id);
      
      // Prepare update data
      const updateData = {
        full_name: data.fullName || data.full_name || currentStaff.fullName,
        email: data.email || currentStaff.email,
        phone: data.phone !== undefined ? data.phone : currentStaff.phone,
        address: data.address !== undefined ? data.address : currentStaff.address,
        role_id: data.roleId || data.role_id || currentStaff.role.id,
        gender: data.gender ? this.normalizeGender(data.gender) : currentStaff.gender,
        birth_date: data.birthDate || data.birth_date || currentStaff.birthDate,
        is_active: data.isActive !== undefined ? data.isActive : currentStaff.isActive
      };
      
      // Handle password update
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      
      // Handle avatar update
      let oldAvatar = null;
      if (data.avatar) {
        oldAvatar = currentStaff.avatar;
        updateData.avatar = formatAvatarPath(data.avatar);
      }
      
      // Build dynamic update query
      const setClause = [];
      const values = [id];
      let paramIndex = 2;
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });
      
      if (setClause.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE staff
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const { rows } = await db.query(query, values);
      
      if (rows.length === 0) {
        throw new NotFoundError('Không tìm thấy nhân viên để cập nhật');
      }
      
      const updatedStaff = this.formatStaffResponse(rows[0]);
      
      // Return old avatar path if it was updated (for cleanup)
      if (oldAvatar) {
        return { ...updatedStaff, oldAvatar };
      }
      
      return updatedStaff;
      
    } catch (error) {
      console.error(`Error updating staff with ID ${id}:`, error);
      
      if (error instanceof NotFoundError || 
          error instanceof ValidationError || 
          error instanceof ConflictError) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error.code === '23505') { // Unique violation
        if (error.constraint?.includes('email')) {
          throw new ConflictError('Email đã được sử dụng');
        } else if (error.constraint?.includes('phone')) {
          throw new ConflictError('Số điện thoại đã được sử dụng');
        } else if (error.constraint?.includes('username')) {
          throw new ConflictError('Tên đăng nhập đã được sử dụng');
        }
      }
      
      throw new DatabaseError('Lỗi khi cập nhật thông tin nhân viên');
    }
  }

  /**
   * Delete a staff member
   * @param {number} id - Staff ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async delete(id) {
    try {
      // First get the staff to return avatar path for cleanup
      const staff = await this.findById(id);
      
      const query = 'DELETE FROM staff WHERE id = $1 RETURNING id';
      const { rowCount } = await db.query(query, [id]);
      
      if (rowCount === 0) {
        throw new NotFoundError('Không tìm thấy nhân viên để xóa');
      }
      
      // Return staff data for cleanup (e.g., avatar file)
      return { success: true, avatar: staff.avatar };
      
    } catch (error) {
      console.error(`Error deleting staff with ID ${id}:`, error);
      
      if (error instanceof NotFoundError) throw error;
      
      // Handle foreign key constraint
      if (error.code === '23503') { // Foreign key violation
        throw new ConflictError('Không thể xóa nhân viên vì có dữ liệu liên quan');
      }
      
      throw new DatabaseError('Lỗi khi xóa nhân viên');
    }
  }

  /**
   * Find all staff with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @param {string} [options.search] - Search term
   * @param {string} [options.role] - Role filter
   * @param {boolean} [options.isActive] - Active status filter
   * @returns {Promise<Object>} Paginated staff list
   */
  static async findAll({
    page = 1,
    limit = 10,
    search,
    role,
    isActive
  } = {}) {
    try {
      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      if (search) {
        conditions.push(`(
          s.username ILIKE $${paramIndex} OR 
          s.full_name ILIKE $${paramIndex} OR 
          s.email ILIKE $${paramIndex} OR
          s.phone ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (role) {
        conditions.push(`r.id = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }
      
      if (isActive !== undefined) {
        conditions.push(`s.is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Count total matching records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      
      // Get paginated results
      const query = `
        SELECT 
          s.*,
          r.id as role_id, 
          r.name as role_name
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const { rows } = await db.query(query, [...params, limit, offset]);
      
      return {
        data: rows.map(staff => this.formatStaffResponse(staff)),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages
        }
      };
      
    } catch (error) {
      console.error('Error finding staff:', error);
      throw new DatabaseError('Lỗi khi lấy danh sách nhân viên');
    }
  }

  /**
   * Find staff by username
   * @param {string} username - Username
   * @param {boolean} includePassword - Whether to include password in response
   * @returns {Promise<Object>} Staff information
   */
  static async findByUsername(username, includePassword = false) {
    try {
      const query = `
        SELECT 
          s.*,
          r.id as role_id, 
          r.name as role_name
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE s.username = $1
      `;
      
      const { rows } = await db.query(query, [username]);
      
      if (rows.length === 0) {
        throw new NotFoundError('Không tìm thấy nhân viên');
      }
      
      return this.formatStaffResponse(rows[0], includePassword);
      
    } catch (error) {
      console.error(`Error finding staff with username ${username}:`, error);
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Lỗi khi lấy thông tin nhân viên');
    }
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} excludeId - Staff ID to exclude from check
   * @returns {Promise<boolean>} Whether username exists
   */
  static async isUsernameExists(username, excludeId = null) {
    if (!username) return false;
    
    const query = 'SELECT id FROM staff WHERE username = $1' + 
                 (excludeId ? ' AND id != $2' : '');
    const params = excludeId ? [username, excludeId] : [username];
    
    const { rows } = await db.query(query, params);
    return rows.length > 0;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeId - Staff ID to exclude from check
   * @returns {Promise<boolean>} Whether email exists
   */
  static async isEmailExists(email, excludeId = null) {
    if (!email) return false;
    
    const query = 'SELECT id FROM staff WHERE email = $1' + 
                 (excludeId ? ' AND id != $2' : '');
    const params = excludeId ? [email, excludeId] : [email];
    
    const { rows } = await db.query(query, params);
    return rows.length > 0;
  }

  /**
   * Check if phone exists
   * @param {string} phone - Phone number to check
   * @param {number} excludeId - Staff ID to exclude from check
   * @returns {Promise<boolean>} Whether phone exists
   */
  static async isPhoneExists(phone, excludeId = null) {
    if (!phone) return false;
    
    const query = 'SELECT id FROM staff WHERE phone = $1' + 
                 (excludeId ? ' AND id != $2' : '');
    const params = excludeId ? [phone, excludeId] : [phone];
    
    const { rows } = await db.query(query, params);
    return rows.length > 0;
  }

  /**
   * Normalize gender value
   * @param {string} gender - Gender value to normalize
   * @returns {string} Normalized gender value
   */
  static normalizeGender(gender) {
    if (!gender) return 'Khác';
    
    const genderMap = {
      'm': 'Nam',
      'male': 'Nam',
      'nam': 'Nam',
      'f': 'Nữ',
      'female': 'Nữ',
      'nu': 'Nữ',
      'nữ': 'Nữ',
      'o': 'Khác',
      'other': 'Khác',
      'khac': 'Khác',
      'khác': 'Khác'
    };
    
    return genderMap[String(gender).toLowerCase()] || 'Khác';
  }

  /**
   * Validate staff data
   * @param {Object} data - Staff data to validate
   * @throws {ValidationError} If validation fails
   */
  static validateStaffData(data) {
    const requiredFields = ['username', 'full_name', 'email', 'password', 'role_id', 'gender', 'birth_date'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Thiếu các trường bắt buộc: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Định dạng email không hợp lệ');
    }

    // Validate password strength
    if (data.password && data.password.length < 6) {
      throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự');
    }
  }

  /**
   * Check for duplicate fields
   * @param {Object} data - Staff data to check
   * @throws {ConflictError} If duplicates found
   */
  static async checkForDuplicates(data) {
    const [usernameExists, emailExists, phoneExists] = await Promise.all([
      this.isUsernameExists(data.username, data.id),
      this.isEmailExists(data.email, data.id),
      data.phone ? this.isPhoneExists(data.phone, data.id) : Promise.resolve(false)
    ]);

    const errors = [];
    if (usernameExists) errors.push('tên đăng nhập');
    if (emailExists) errors.push('email');
    if (phoneExists) errors.push('số điện thoại');

    if (errors.length > 0) {
      throw new ConflictError(`Các trường sau đã được sử dụng: ${errors.join(', ')}`);
    }
  }

  /**
   * Format staff response
   * @param {Object} staff - Staff data from database
   * @param {boolean} includePassword - Whether to include password in response
   * @returns {Object} Formatted staff data
   */
  static formatStaffResponse(staff, includePassword = false) {
    const response = {
      id: staff.id,
      username: staff.username,
      fullName: staff.full_name || staff.fullName,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      gender: this.normalizeGender(staff.gender),
      birthDate: staff.birth_date || staff.birthDate,
      avatar: staff.avatar || formatAvatarPath(null),
      isActive: staff.is_active !== undefined ? staff.is_active : staff.isActive,
      role: {
        id: staff.role_id || (staff.role ? staff.role.id : null),
        name: staff.role_name || (staff.role ? staff.role.name : null)
      },
      createdAt: staff.created_at || staff.createdAt,
      updatedAt: staff.updated_at || staff.updatedAt
    };

    if (includePassword) {
      response.password = staff.password;
    }

    return response;
  }
}

module.exports = Staff;
