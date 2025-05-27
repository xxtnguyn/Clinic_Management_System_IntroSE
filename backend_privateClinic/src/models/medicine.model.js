const db = require('../config/db');
const { NotFoundError, DatabaseError, ConflictError } = require('../utils/apiError');

/**
 * Medicine Model
 * Quản lý thao tác với bảng medicines
 */
class Medicine {
  /**
   * Lấy danh sách thuốc
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách thuốc
   */
  static async findAll(options = {}) {
    const { 
      search = '', 
      unit,
      lowStock = false,
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id, name, unit, price, quantity_in_stock, 
        description, created_at, updated_at
      FROM medicines
    `;
    
    let countQuery = `
      SELECT COUNT(*) FROM medicines
    `;
    
    const queryParams = [];
    let conditions = [];
    
    // Thêm điều kiện lọc
    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`name ILIKE $${queryParams.length}`);
    }
    
    if (unit) {
      queryParams.push(unit);
      conditions.push(`unit = $${queryParams.length}`);
    }
    
    if (lowStock) {
      // Lọc các thuốc có số lượng thấp (ví dụ dưới 20)
      conditions.push(`quantity_in_stock < 20`);
    }
    
    // Thêm WHERE nếu có điều kiện lọc
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp và phân trang
    query += ` 
      ORDER BY name
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    
    const { rows } = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
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
   * Tìm thuốc theo ID
   * @param {Number} id - ID của thuốc
   * @returns {Promise<Object>} Thông tin thuốc
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, name, unit, price, quantity_in_stock, 
        description, created_at, updated_at
      FROM medicines
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy thuốc');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo thuốc mới
   * @param {Object} data - Dữ liệu thuốc
   * @returns {Promise<Object>} Thuốc mới tạo
   */
  static async create(data) {
    try {
      const { 
        name, 
        unit, 
        price, 
        quantity_in_stock = 0, 
        description 
      } = data;
      
      const query = `
        INSERT INTO medicines (name, unit, price, quantity_in_stock, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, unit, price, quantity_in_stock, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        name, 
        unit, 
        price, 
        quantity_in_stock, 
        description
      ]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger check_max_medicines
      if (error.code === 'P0001' && error.message.includes('Đã đạt đến giới hạn số lượng thuốc')) {
        throw new DatabaseError(
          'Đã đạt đến giới hạn số lượng thuốc',
          error.detail,
          error.hint
        );
      }
      
      // Lỗi unique constraint (tên thuốc trùng)
      if (error.code === '23505' && error.constraint === 'medicines_name_key') {
        throw new DatabaseError(
          'Tên thuốc đã tồn tại',
          'Mỗi thuốc phải có tên riêng biệt',
          'Vui lòng chọn tên thuốc khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật thông tin thuốc
   * @param {Number} id - ID của thuốc
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Thuốc sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra thuốc tồn tại
    await this.findById(id);
    
    const { 
      name, 
      unit, 
      price, 
      description 
    } = data;
    
    try {
      const query = `
        UPDATE medicines
        SET 
          name = COALESCE($1, name),
          unit = COALESCE($2, unit),
          price = COALESCE($3, price),
          description = COALESCE($4, description)
        WHERE id = $5
        RETURNING id, name, unit, price, quantity_in_stock, description, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        name, 
        unit, 
        price, 
        description, 
        id
      ]);
      
      return rows[0];
    } catch (error) {
      // Lỗi unique constraint (tên thuốc trùng)
      if (error.code === '23505' && error.constraint === 'medicines_name_key') {
        throw new DatabaseError(
          'Tên thuốc đã tồn tại',
          'Mỗi thuốc phải có tên riêng biệt',
          'Vui lòng chọn tên thuốc khác'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật số lượng thuốc trong kho
   * @param {Number} id - ID của thuốc
   * @param {Number} quantity - Số lượng thêm vào (dương) hoặc lấy ra (âm)
   * @returns {Promise<Object>} Thuốc sau khi cập nhật
   */
  static async updateStock(id, quantity) {
    // Kiểm tra thuốc tồn tại
    const medicine = await this.findById(id);
    
    // Kiểm tra nếu lấy ra, số lượng phải đủ
    if (quantity < 0 && medicine.quantity_in_stock < Math.abs(quantity)) {
      throw new DatabaseError(
        'Không đủ số lượng thuốc trong kho',
        `Thuốc: ${medicine.name}, Số lượng yêu cầu: ${Math.abs(quantity)}, Số lượng hiện có: ${medicine.quantity_in_stock}`,
        'Vui lòng kiểm tra lại số lượng thuốc trong kho hoặc nhập thêm thuốc'
      );
    }
    
    const query = `
      UPDATE medicines
      SET quantity_in_stock = quantity_in_stock + $1
      WHERE id = $2
      RETURNING id, name, unit, price, quantity_in_stock, description, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [quantity, id]);
    
    return rows[0];
  }
  
  /**
   * Xóa thuốc
   * @param {Number} id - ID của thuốc
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra thuốc tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM medicines WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new DatabaseError(
          'Không thể xóa thuốc này vì đã có dữ liệu liên quan',
          'Thuốc đã được sử dụng trong đơn thuốc',
          'Vui lòng xóa các đơn thuốc liên quan trước khi xóa thuốc này'
        );
      }
      throw error;
    }
  }
  
  /**
   * Lấy thống kê sử dụng thuốc
   * @param {Object} options - Các tùy chọn lọc
   * @returns {Promise<Array>} Thống kê sử dụng thuốc
   */
  static async getUsageStatistics(options = {}) {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        m.id,
        m.name,
        m.unit,
        SUM(p.quantity) as total_quantity,
        COUNT(p.id) as prescription_count
      FROM medicines m
      LEFT JOIN prescriptions p ON m.id = p.medicine_id
    `;
    
    const queryParams = [];
    let conditions = [];
    
    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      query += `
        LEFT JOIN medical_records mr ON p.medical_record_id = mr.id
      `;
      conditions.push(`mr.examination_date BETWEEN $1 AND $2`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY m.id, m.name, m.unit
      ORDER BY total_quantity DESC NULLS LAST
    `;
    
    const { rows } = await db.query(query, queryParams);
    
    return rows;
  }
  
  /**
   * Lấy số lượng thuốc tối đa từ cài đặt
   * @returns {Promise<Number>} Số lượng tối đa
   */
  static async getMaxMedicinesCount() {
    const query = `
      SELECT value::INTEGER as max_medicines
      FROM settings
      WHERE key = 'max_medicines'
    `;
    
    const { rows } = await db.query(query);
    
    if (rows.length === 0) {
      return 30; // Giá trị mặc định
    }
    
    return rows[0].max_medicines;
  }

  /**
   * Kiểm tra tên thuốc đã tồn tại chưa
   * @param {string} name - Tên thuốc cần kiểm tra
   * @param {number} [excludeId=null] - ID thuốc cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<boolean>} true nếu tên đã tồn tại, ngược lại false
   */
  static async isNameExists(name, excludeId = null) {
    if (!name) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM medicines 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        ${excludeId ? 'AND id != $2' : ''}
      ) as exists
    `;
    
    const params = [name];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }
}

module.exports = Medicine;
