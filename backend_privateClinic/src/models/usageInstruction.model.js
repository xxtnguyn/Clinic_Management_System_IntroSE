const db = require('../config/db');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * UsageInstruction Model
 * Quản lý thao tác với bảng usage_instructions
 */
class UsageInstruction {
  /**
   * Lấy danh sách tất cả cách dùng thuốc
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách cách dùng thuốc
   */
  static async findAll(options = {}) {
    const { search = '', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, instruction, description, created_at, updated_at
      FROM usage_instructions
      WHERE 
        instruction ILIKE $1 OR
        description ILIKE $1
      ORDER BY instruction
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM usage_instructions
      WHERE 
        instruction ILIKE $1 OR
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
   * Tìm cách dùng thuốc theo ID
   * @param {Number} id - ID của cách dùng thuốc
   * @returns {Promise<Object>} Thông tin cách dùng thuốc
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, instruction, description, created_at, updated_at
      FROM usage_instructions
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy cách dùng thuốc');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo cách dùng thuốc mới
   * @param {Object} data - Dữ liệu cách dùng thuốc
   * @returns {Promise<Object>} Cách dùng thuốc mới tạo
   */
  static async create(data) {
    try {
      const { instruction, description } = data;
      
      const query = `
        INSERT INTO usage_instructions (instruction, description)
        VALUES ($1, $2)
        RETURNING id, instruction, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [instruction, description]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger check_max_usage_instructions
      if (error.code === 'P0001' && error.message.includes('Đã đạt đến giới hạn số lượng cách dùng')) {
        throw new DatabaseError(
          'Đã đạt đến giới hạn số lượng cách dùng',
          error.detail,
          error.hint
        );
      }
      
      // Lỗi unique constraint (cách dùng trùng)
      if (error.code === '23505' && error.constraint === 'unique_instruction') {
        throw new DatabaseError(
          'Cách dùng thuốc này đã tồn tại',
          'Mỗi cách dùng phải duy nhất',
          'Vui lòng chọn cách dùng khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin cách dùng thuốc
   * @param {Number} id - ID của cách dùng thuốc
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Cách dùng thuốc sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra cách dùng thuốc tồn tại
    await this.findById(id);
    
    const { instruction, description } = data;
    
    try {
      const query = `
        UPDATE usage_instructions
        SET 
          instruction = COALESCE($1, instruction),
          description = COALESCE($2, description)
        WHERE id = $3
        RETURNING id, instruction, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [instruction, description, id]);
      
      return rows[0];
    } catch (error) {
      // Lỗi unique constraint (cách dùng trùng)
      if (error.code === '23505' && error.constraint === 'unique_instruction') {
        throw new DatabaseError(
          'Cách dùng thuốc này đã tồn tại',
          'Mỗi cách dùng phải duy nhất',
          'Vui lòng chọn cách dùng khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Xóa cách dùng thuốc
   * @param {Number} id - ID của cách dùng thuốc
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra cách dùng thuốc tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM usage_instructions WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new DatabaseError(
          'Không thể xóa cách dùng thuốc này vì đã có dữ liệu liên quan',
          'Cách dùng thuốc đã được sử dụng trong đơn thuốc',
          'Vui lòng xóa các đơn thuốc liên quan trước khi xóa cách dùng thuốc này'
        );
      }
      throw error;
    }
  }
  
  /**
   * Lấy số lượng cách dùng thuốc tối đa từ cài đặt
   * @returns {Promise<Number>} Số lượng tối đa
   */
  static async getMaxUsageInstructionsCount() {
    const query = `
      SELECT value::INTEGER as max_usage_instructions
      FROM settings
      WHERE key = 'max_usage_instructions'
    `;
    
    const { rows } = await db.query(query);
    
    if (rows.length === 0) {
      return 4; // Giá trị mặc định
    }
    
    return rows[0].max_usage_instructions;
  }
}

module.exports = UsageInstruction;
