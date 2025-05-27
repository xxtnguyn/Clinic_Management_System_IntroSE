const db = require('../config/db');
const { NotFoundError, ValidationError } = require('../utils/apiError');

/**
 * Patient Model
 * Quản lý thao tác với bảng patients
 */
class Patient {
  /**
   * Lấy tất cả bệnh nhân
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách bệnh nhân
   */
  static async findAll(options = {}) {
    const { search = '', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, full_name, gender, birth_year, 
        phone, address, created_at, updated_at,
        (SELECT EXTRACT(YEAR FROM CURRENT_DATE) - birth_year) AS age
      FROM patients
      WHERE 
        full_name ILIKE $1 OR
        phone ILIKE $1 OR
        address ILIKE $1
      ORDER BY full_name
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM patients
      WHERE 
        full_name ILIKE $1 OR
        phone ILIKE $1 OR
        address ILIKE $1
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
   * Tìm bệnh nhân theo ID
   * @param {Number} id - ID của bệnh nhân
   * @returns {Promise<Object>} Thông tin bệnh nhân
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, full_name, gender, birth_year, 
        phone, address, created_at, updated_at,
        (SELECT EXTRACT(YEAR FROM CURRENT_DATE) - birth_year) AS age
      FROM patients
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy bệnh nhân');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo bệnh nhân mới
   * @param {Object} data - Dữ liệu bệnh nhân
   * @returns {Promise<Object>} Bệnh nhân mới tạo
   */
  /**
   * Kiểm tra số điện thoại đã tồn tại chưa
   * @param {string} phone - Số điện thoại cần kiểm tra
   * @param {number} [excludeId] - ID bệnh nhân cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<boolean>} true nếu số điện thoại đã tồn tại
   */
  static async checkPhoneExists(phone, excludeId = null) {
    if (!phone) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM patients 
        WHERE phone = $1 
        ${excludeId ? 'AND id != $2' : ''}
      )
    `;
    
    const params = excludeId ? [phone, excludeId] : [phone];
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Lấy lịch sử khám bệnh của bệnh nhân
   * @param {number} patientId - ID bệnh nhân
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>} Danh sách lịch sử khám bệnh
   */
  static async getMedicalHistory(patientId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        m.id, m.diagnosis, m.note, m.created_at as visit_date,
        d.full_name as doctor_name,
        COUNT(*) OVER() as total_count
      FROM medical_records m
      JOIN staff d ON m.doctor_id = d.id
      WHERE m.patient_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await db.query(query, [patientId, limit, offset]);
    
    if (rows.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      };
    }
    
    const total = parseInt(rows[0].total_count);
    
    // Loại bỏ total_count khỏi kết quả trả về
    const data = rows.map(({ total_count, ...rest }) => rest);
    
    return {
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async create(data) {
    const { phone } = data;
    
    // Kiểm tra số điện thoại trùng lặp
    const phoneExists = await this.checkPhoneExists(phone);
    if (phoneExists) {
      throw new ValidationError('Số điện thoại đã được sử dụng');
    }
    
    const query = `
      INSERT INTO patients (full_name, gender, birth_year, phone, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, gender, birth_year, phone, address, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [
      data.full_name,
      data.gender,
      data.birth_year,
      phone || null,
      data.address || null
    ]);
    
    return rows[0];
  }
  
  /**
   * Cập nhật thông tin bệnh nhân
   * @param {Number} id - ID của bệnh nhân
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Bệnh nhân sau khi cập nhật
   */
  static async update(id, data) {
    const { phone, ...updateData } = data;
    
    // Kiểm tra số điện thoại trùng lặp (nếu có cập nhật số điện thoại)
    if (phone !== undefined) {
      const phoneExists = await this.checkPhoneExists(phone, id);
      if (phoneExists) {
        throw new ValidationError('Số điện thoại đã được sử dụng bởi bệnh nhân khác');
      }
    }
    
    // Tạo câu lệnh SQL động dựa trên các trường cần cập nhật
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Thêm các trường cần cập nhật
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    // Thêm số điện thoại nếu có
    if (phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(phone || null);
      paramIndex++;
    }
    
    // Thêm updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Thêm điều kiện WHERE
    values.push(id);
    
    const query = `
      UPDATE patients
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, full_name, gender, birth_year, phone, address, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, values);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy bệnh nhân');
    }
    
    return rows[0];
  }
  
  /**
   * Xóa bệnh nhân
   * @param {Number} id - ID của bệnh nhân
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra bệnh nhân tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM patients WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Không thể xóa bệnh nhân này vì đã có dữ liệu liên quan');
      }
      throw error;
    }
  }
  
  /**
   * Lấy lịch sử khám bệnh của bệnh nhân
   * @param {Number} id - ID của bệnh nhân
   * @returns {Promise<Array>} Lịch sử khám bệnh
   */
  static async getMedicalHistory(id) {
    // Kiểm tra bệnh nhân tồn tại
    await this.findById(id);
    
    const query = `
      SELECT 
        mr.id, mr.examination_date, mr.symptoms, mr.diagnosis, 
        dt.name as disease_type, mr.status,
        s.full_name as doctor_name
      FROM medical_records mr
      JOIN disease_types dt ON mr.disease_type_id = dt.id
      JOIN staff s ON mr.staff_id = s.id
      WHERE mr.patient_id = $1
      ORDER BY mr.examination_date DESC
    `;
    
    const { rows } = await db.query(query, [id]);
    
    return rows;
  }

  /**
   * Kiểm tra số điện thoại đã tồn tại chưa
   * @param {String} phone - Số điện thoại cần kiểm tra
   * @param {Number} [excludeId=null] - ID bệnh nhân cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isPhoneExists(phone, excludeId = null) {
    if (!phone) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM patients 
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
   * Kiểm tra trường dữ liệu đã tồn tại chưa
   * @param {String} field - Tên trường cần kiểm tra
   * @param {String} value - Giá trị cần kiểm tra
   * @param {Number} [excludeId=null] - ID bệnh nhân cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isExists(field, value, excludeId = null) {
    if (!value) return false;
    
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM patients 
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

module.exports = Patient;
