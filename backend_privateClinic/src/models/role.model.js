const db = require('../config/db');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/apiError');

/**
 * Role Model
 * Quản lý thao tác với bảng roles (vai trò người dùng)
 */
class Role {
  /**
   * Lấy danh sách tất cả vai trò
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách vai trò
   */
  static async findAll(options = {}) {
    const { search = '', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM roles
      WHERE 
        name ILIKE $1 OR
        description ILIKE $1
      ORDER BY name
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM roles
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
      }
    };
  }
  
  /**
   * Lấy tất cả vai trò không phân trang
   * @returns {Promise<Array>} Danh sách vai trò
   */
  static async getAllRoles() {
    const query = `
      SELECT id, name, description
      FROM roles
      ORDER BY name
    `;
    
    const { rows } = await db.query(query);
    return rows;
  }
  
  /**
   * Tìm vai trò theo ID
   * @param {Number} id - ID của vai trò
   * @returns {Promise<Object>} Thông tin vai trò
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM roles
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy vai trò');
    }
    
    return rows[0];
  }
  
  /**
   * Tìm vai trò kèm quyền hạn
   * @param {Number} id - ID của vai trò
   * @returns {Promise<Object>} Thông tin vai trò kèm quyền hạn
   */
  static async findByIdWithPermissions(id) {
    // Lấy thông tin vai trò
    const role = await this.findById(id);
    
    // Lấy danh sách quyền của vai trò
    const permissionsQuery = `
      SELECT 
        p.id, p.name, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      ORDER BY p.name
    `;
    
    const { rows: permissions } = await db.query(permissionsQuery, [id]);
    
    return {
      ...role,
      permissions
    };
  }
  
  /**
   * Tạo vai trò mới
   * @param {Object} data - Dữ liệu vai trò
   * @returns {Promise<Object>} Vai trò mới tạo
   */
  static async create(data) {
    try {
      const { name, description, permissionIds = [] } = data;
      
      // Bắt đầu transaction
      await db.query('BEGIN');
      
      // Tạo vai trò mới
      const query = `
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [name, description]);
      const roleId = rows[0].id;
      
      // Thêm quyền cho vai trò
      if (permissionIds.length > 0) {
        // Kiểm tra các quyền có tồn tại
        const checkPermissionsQuery = `
          SELECT id FROM permissions WHERE id = ANY($1::int[])
        `;
        
        const permissionsResult = await db.query(checkPermissionsQuery, [permissionIds]);
        
        if (permissionsResult.rows.length !== permissionIds.length) {
          await db.query('ROLLBACK');
          throw new NotFoundError('Một số quyền không tồn tại');
        }
        
        // Tạo các bản ghi trong bảng role_permissions
        const rolePermValues = permissionIds.map(permissionId => 
          `(${roleId}, ${permissionId})`
        ).join(', ');
        
        const rolePermQuery = `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${rolePermValues}
        `;
        
        await db.query(rolePermQuery);
      }
      
      // Hoàn thành transaction
      await db.query('COMMIT');
      
      // Trả về vai trò kèm quyền hạn
      return this.findByIdWithPermissions(roleId);
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await db.query('ROLLBACK');
      
      // Lỗi unique constraint (tên vai trò trùng)
      if (error.code === '23505' && error.constraint === 'roles_name_key') {
        throw new ConflictError(
          'Tên vai trò đã tồn tại',
          'Vui lòng chọn tên vai trò khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin vai trò
   * @param {Number} id - ID của vai trò
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Vai trò sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra vai trò tồn tại
    await this.findById(id);
    
    const { name, description, permissionIds } = data;
    
    try {
      // Bắt đầu transaction
      await db.query('BEGIN');
      
      // Cập nhật thông tin vai trò
      const query = `
        UPDATE roles
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description)
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `;
      
      await db.query(query, [name, description, id]);
      
      // Cập nhật quyền của vai trò nếu có
      if (permissionIds !== undefined) {
        // Xóa tất cả quyền hiện tại
        await db.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        
        // Thêm quyền mới nếu có
        if (permissionIds.length > 0) {
          // Kiểm tra các quyền có tồn tại
          const checkPermissionsQuery = `
            SELECT id FROM permissions WHERE id = ANY($1::int[])
          `;
          
          const permissionsResult = await db.query(checkPermissionsQuery, [permissionIds]);
          
          if (permissionsResult.rows.length !== permissionIds.length) {
            await db.query('ROLLBACK');
            throw new NotFoundError('Một số quyền không tồn tại');
          }
          
          // Tạo các bản ghi trong bảng role_permissions
          const rolePermValues = permissionIds.map(permissionId => 
            `(${id}, ${permissionId})`
          ).join(', ');
          
          const rolePermQuery = `
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ${rolePermValues}
          `;
          
          await db.query(rolePermQuery);
        }
      }
      
      // Hoàn thành transaction
      await db.query('COMMIT');
      
      // Trả về vai trò kèm quyền hạn
      return this.findByIdWithPermissions(id);
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await db.query('ROLLBACK');
      
      // Lỗi unique constraint (tên vai trò trùng)
      if (error.code === '23505' && error.constraint === 'roles_name_key') {
        throw new ConflictError(
          'Tên vai trò đã tồn tại',
          'Vui lòng chọn tên vai trò khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Xóa vai trò
   * @param {Number} id - ID của vai trò
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra vai trò tồn tại
    await this.findById(id);
    
    try {
      // Bắt đầu transaction
      await db.query('BEGIN');
      
      // Xóa tất cả quyền của vai trò
      await db.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      
      // Xóa vai trò
      await db.query('DELETE FROM roles WHERE id = $1', [id]);
      
      // Hoàn thành transaction
      await db.query('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await db.query('ROLLBACK');
      
      // Lỗi foreign key (vai trò đang được sử dụng)
      if (error.code === '23503') {
        throw new DatabaseError(
          'Không thể xóa vai trò này vì đang được sử dụng',
          'Vai trò này đã được gán cho nhân viên',
          'Vui lòng gán vai trò khác cho nhân viên trước khi xóa'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Thêm quyền cho vai trò
   * @param {Number} roleId - ID của vai trò
   * @param {Number} permissionId - ID của quyền
   * @returns {Promise<Boolean>} Kết quả thêm quyền
   */
  static async addPermission(roleId, permissionId) {
    // Kiểm tra vai trò tồn tại
    await this.findById(roleId);
    
    try {
      // Kiểm tra quyền tồn tại
      const permQuery = 'SELECT id FROM permissions WHERE id = $1';
      const permResult = await db.query(permQuery, [permissionId]);
      
      if (permResult.rows.length === 0) {
        throw new NotFoundError('Không tìm thấy quyền');
      }
      
      // Kiểm tra quyền đã được gán cho vai trò chưa
      const checkQuery = 'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2';
      const checkResult = await db.query(checkQuery, [roleId, permissionId]);
      
      if (checkResult.rows.length > 0) {
        // Quyền đã được gán, không cần thêm lại
        return true;
      }
      
      // Thêm quyền cho vai trò
      const query = 'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)';
      await db.query(query, [roleId, permissionId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Xóa quyền khỏi vai trò
   * @param {Number} roleId - ID của vai trò
   * @param {Number} permissionId - ID của quyền
   * @returns {Promise<Boolean>} Kết quả xóa quyền
   */
  static async removePermission(roleId, permissionId) {
    // Kiểm tra vai trò tồn tại
    await this.findById(roleId);
    
    try {
      // Xóa quyền khỏi vai trò
      const query = 'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2';
      await db.query(query, [roleId, permissionId]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Role;
