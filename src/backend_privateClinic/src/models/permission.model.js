const db = require('../config/db');
const { NotFoundError, ConflictError } = require('../utils/apiError');

/**
 * Permission Model
 * Quản lý thao tác với bảng permissions (quyền hạn)
 */
class Permission {
  /**
   * Lấy danh sách tất cả quyền
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách quyền
   */
  static async findAll(options = {}) {
    const { search = '', page = 1, limit = 10, groupBy = false } = options;
    const offset = (page - 1) * limit;
    
    // Nếu groupBy = true, nhóm quyền theo module
    if (groupBy) {
      const query = `
        SELECT 
          SUBSTRING(name, 1, POSITION('_' in name) - 1) as module,
          json_agg(
            json_build_object(
              'id', id,
              'name', name,
              'description', description,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY name
          ) as permissions
        FROM permissions
        WHERE 
          name ILIKE $1 OR
          description ILIKE $1
        GROUP BY module
        ORDER BY module
      `;
      
      const searchParam = `%${search}%`;
      const { rows } = await db.query(query, [searchParam]);
      
      return {
        data: rows,
        groupedByModule: true
      };
    }
    
    // Nếu không nhóm, trả về danh sách thông thường
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM permissions
      WHERE 
        name ILIKE $1 OR
        description ILIKE $1
      ORDER BY name
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM permissions
      WHERE 
        name ILIKE $1 OR
        description ILIKE $1
    `;
    
    const searchParam = `%${search}%`;
    
    const { rows } = await db.query(query, [searchParam, limit, offset]);
    const countResult = await db.query(countQuery, [searchParam]);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      groupedByModule: false
    };
  }
  
  /**
   * Lấy tất cả quyền không phân trang
   * @returns {Promise<Array>} Danh sách quyền
   */
  static async getAllPermissions() {
    const query = `
      SELECT id, name, description
      FROM permissions
      ORDER BY name
    `;
    
    const { rows } = await db.query(query);
    return rows;
  }
  
  /**
   * Tìm quyền theo ID
   * @param {Number} id - ID của quyền
   * @returns {Promise<Object>} Thông tin quyền
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM permissions
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy quyền');
    }
    
    return rows[0];
  }
  
  /**
   * Tìm quyền theo tên
   * @param {String} name - Tên quyền
   * @returns {Promise<Object>} Thông tin quyền
   */
  static async findByName(name) {
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM permissions
      WHERE name = $1
    `;
    
    const { rows } = await db.query(query, [name]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy quyền');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo quyền mới
   * @param {Object} data - Dữ liệu quyền
   * @returns {Promise<Object>} Quyền mới tạo
   */
  static async create(data) {
    try {
      const { name, description } = data;
      
      const query = `
        INSERT INTO permissions (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [name, description]);
      
      return rows[0];
    } catch (error) {
      // Lỗi unique constraint (tên quyền trùng)
      if (error.code === '23505' && error.constraint === 'permissions_name_key') {
        throw new ConflictError(
          'Tên quyền đã tồn tại',
          'Vui lòng chọn tên quyền khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin quyền
   * @param {Number} id - ID của quyền
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Quyền sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra quyền tồn tại
    await this.findById(id);
    
    const { name, description } = data;
    
    try {
      const query = `
        UPDATE permissions
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description)
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [name, description, id]);
      
      return rows[0];
    } catch (error) {
      // Lỗi unique constraint (tên quyền trùng)
      if (error.code === '23505' && error.constraint === 'permissions_name_key') {
        throw new ConflictError(
          'Tên quyền đã tồn tại',
          'Vui lòng chọn tên quyền khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Xóa quyền
   * @param {Number} id - ID của quyền
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra quyền tồn tại
    await this.findById(id);
    
    try {
      // Bắt đầu transaction
      await db.query('BEGIN');
      
      // Xóa tất cả liên kết vai trò-quyền
      await db.query('DELETE FROM role_permissions WHERE permission_id = $1', [id]);
      
      // Xóa quyền
      await db.query('DELETE FROM permissions WHERE id = $1', [id]);
      
      // Hoàn thành transaction
      await db.query('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Lấy danh sách vai trò có quyền cụ thể
   * @param {Number} permissionId - ID của quyền
   * @returns {Promise<Array>} Danh sách vai trò
   */
  static async getRolesWithPermission(permissionId) {
    // Kiểm tra quyền tồn tại
    await this.findById(permissionId);
    
    const query = `
      SELECT 
        r.id, r.name, r.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.permission_id = $1
      ORDER BY r.name
    `;
    
    const { rows } = await db.query(query, [permissionId]);
    
    return rows;
  }
}

module.exports = Permission;
