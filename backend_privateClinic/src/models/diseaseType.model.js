const db = require('../config/db');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * DiseaseType Model
 * Quản lý thao tác với bảng disease_types
 */
class DiseaseType {
  /**
   * Lấy danh sách tất cả loại bệnh
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách loại bệnh
   */
  static async findAll(options = {}) {
    const { search = '', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM disease_types
      WHERE 
        name ILIKE $1 OR
        description ILIKE $1
      ORDER BY name
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM disease_types
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
   * Tìm loại bệnh theo ID
   * @param {Number} id - ID của loại bệnh
   * @returns {Promise<Object>} Thông tin loại bệnh
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, name, description, created_at, updated_at
      FROM disease_types
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy loại bệnh');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo loại bệnh mới
   * @param {Object} data - Dữ liệu loại bệnh
   * @returns {Promise<Object>} Loại bệnh mới tạo
   */
  static async create(data) {
    try {
      const { name, description } = data;
      
      const query = `
        INSERT INTO disease_types (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [name, description]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger check_max_disease_types
      if (error.code === 'P0001' && error.message.includes('Đã đạt đến giới hạn số lượng loại bệnh')) {
        throw new DatabaseError(
          'Đã đạt đến giới hạn số lượng loại bệnh',
          error.detail,
          error.hint
        );
      }
      
      // Lỗi unique constraint (tên loại bệnh trùng)
      if (error.code === '23505' && error.constraint === 'disease_types_name_key') {
        throw new DatabaseError(
          'Tên loại bệnh đã tồn tại',
          'Mỗi loại bệnh phải có tên riêng biệt',
          'Vui lòng chọn tên loại bệnh khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin loại bệnh
   * @param {Number} id - ID của loại bệnh
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Loại bệnh sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra loại bệnh tồn tại
    await this.findById(id);
    
    const { name, description } = data;
    
    try {
      const query = `
        UPDATE disease_types
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description)
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [name, description, id]);
      
      return rows[0];
    } catch (error) {
      // Lỗi unique constraint (tên loại bệnh trùng)
      if (error.code === '23505' && error.constraint === 'disease_types_name_key') {
        throw new DatabaseError(
          'Tên loại bệnh đã tồn tại',
          'Mỗi loại bệnh phải có tên riêng biệt',
          'Vui lòng chọn tên loại bệnh khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Xóa loại bệnh
   * @param {Number} id - ID của loại bệnh
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra loại bệnh tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM disease_types WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new DatabaseError(
          'Không thể xóa loại bệnh này vì đã có dữ liệu liên quan',
          'Loại bệnh đã được sử dụng trong hồ sơ bệnh án',
          'Vui lòng xóa các hồ sơ bệnh án liên quan trước khi xóa loại bệnh này'
        );
      }
      throw error;
    }
  }
  
  /**
   * Kiểm tra tên loại bệnh đã tồn tại chưa
   * @param {String} name - Tên loại bệnh cần kiểm tra
   * @param {Number} [excludeId=null] - ID loại bệnh cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu tên đã tồn tại, ngược lại false
   */
  static async isNameExists(name, excludeId = null) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM disease_types 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [name];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Lấy số lượng loại bệnh tối đa từ cài đặt
   * @returns {Promise<Number>} Số lượng tối đa
   */
  static async getMaxDiseaseTypesCount() {
    const query = `
      SELECT value::INTEGER as max_disease_types
      FROM settings
      WHERE key = 'max_disease_types'
    `;
    
    const { rows } = await db.query(query);
    
    if (rows.length === 0) {
      return 5; // Giá trị mặc định
    }
    
    return rows[0].max_disease_types;
  }
}

module.exports = DiseaseType;
