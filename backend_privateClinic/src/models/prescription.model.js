const db = require('../config/db');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * Prescription Model
 * Quản lý thao tác với bảng prescriptions
 */
class Prescription {
  /**
   * Lấy danh sách đơn thuốc
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách đơn thuốc
   */
  static async findAll(options = {}) {
    const { 
      medicalRecordId,
      medicineId,
      staffId,
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.id, p.medical_record_id, p.medicine_id, p.staff_id,
        p.quantity, p.usage_instruction_id, p.notes,
        p.created_at, p.updated_at,
        m.name as medicine_name, m.unit as medicine_unit, 
        m.price as medicine_price,
        ui.instruction as usage_instruction,
        s.full_name as staff_name,
        mr.patient_id,
        pt.full_name as patient_name
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      JOIN usage_instructions ui ON p.usage_instruction_id = ui.id
      JOIN staff s ON p.staff_id = s.id
      JOIN medical_records mr ON p.medical_record_id = mr.id
      JOIN patients pt ON mr.patient_id = pt.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM prescriptions p
      JOIN medical_records mr ON p.medical_record_id = mr.id
    `;
    
    const queryParams = [];
    let conditions = [];
    
    // Thêm điều kiện lọc
    if (medicalRecordId) {
      queryParams.push(medicalRecordId);
      conditions.push(`p.medical_record_id = $${queryParams.length}`);
    }
    
    if (medicineId) {
      queryParams.push(medicineId);
      conditions.push(`p.medicine_id = $${queryParams.length}`);
    }
    
    if (staffId) {
      queryParams.push(staffId);
      conditions.push(`p.staff_id = $${queryParams.length}`);
    }
    
    // Thêm WHERE nếu có điều kiện lọc
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp và phân trang
    query += ` 
      ORDER BY p.id
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
   * Tìm đơn thuốc theo ID
   * @param {Number} id - ID của đơn thuốc
   * @returns {Promise<Object>} Thông tin đơn thuốc
   */
  static async findById(id) {
    const query = `
      SELECT 
        p.id, p.medical_record_id, p.medicine_id, p.staff_id,
        p.quantity, p.usage_instruction_id, p.notes,
        p.created_at, p.updated_at,
        m.name as medicine_name, m.unit as medicine_unit, 
        m.price as medicine_price,
        ui.instruction as usage_instruction,
        s.full_name as staff_name,
        mr.patient_id,
        pt.full_name as patient_name
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      JOIN usage_instructions ui ON p.usage_instruction_id = ui.id
      JOIN staff s ON p.staff_id = s.id
      JOIN medical_records mr ON p.medical_record_id = mr.id
      JOIN patients pt ON mr.patient_id = pt.id
      WHERE p.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy đơn thuốc');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo đơn thuốc mới
   * @param {Object} data - Dữ liệu đơn thuốc
   * @returns {Promise<Object>} Đơn thuốc mới tạo
   */
  static async create(data) {
    try {
      const { 
        medical_record_id, 
        medicine_id, 
        staff_id, 
        quantity, 
        usage_instruction_id, 
        notes 
      } = data;
      
      const query = `
        INSERT INTO prescriptions (
          medical_record_id, medicine_id, staff_id, 
          quantity, usage_instruction_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, medical_record_id, medicine_id, staff_id, 
                  quantity, usage_instruction_id, notes, 
                  created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        medical_record_id, 
        medicine_id, 
        staff_id, 
        quantity, 
        usage_instruction_id, 
        notes
      ]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger check_medicine_stock
      if (error.code === 'P0001' && error.message.includes('Không đủ số lượng thuốc trong kho')) {
        throw new DatabaseError(
          'Không đủ số lượng thuốc trong kho',
          error.detail,
          error.hint
        );
      }
      throw error;
    }
  }
  
  /**
   * Cập nhật đơn thuốc
   * @param {Number} id - ID của đơn thuốc
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Đơn thuốc sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra đơn thuốc tồn tại
    await this.findById(id);
    
    const { 
      quantity, 
      usage_instruction_id, 
      notes 
    } = data;
    
    const query = `
      UPDATE prescriptions
      SET 
        quantity = COALESCE($1, quantity),
        usage_instruction_id = COALESCE($2, usage_instruction_id),
        notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING id, medical_record_id, medicine_id, staff_id, 
                quantity, usage_instruction_id, notes, 
                created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [
      quantity, 
      usage_instruction_id, 
      notes, 
      id
    ]);
    
    return rows[0];
  }
  
  /**
   * Xóa đơn thuốc
   * @param {Number} id - ID của đơn thuốc
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra đơn thuốc tồn tại
    const prescription = await this.findById(id);
    
    // Cập nhật lại số lượng thuốc khi xóa đơn
    try {
      // Bắt đầu transaction
      await db.query('BEGIN');
      
      // Cập nhật lại số lượng thuốc trong kho
      await db.query(
        'UPDATE medicines SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2',
        [prescription.quantity, prescription.medicine_id]
      );
      
      // Xóa đơn thuốc
      await db.query('DELETE FROM prescriptions WHERE id = $1', [id]);
      
      // Hoàn thành transaction
      await db.query('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback nếu có lỗi
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Tính tổng tiền thuốc cho một hồ sơ bệnh án
   * @param {Number} medicalRecordId - ID của hồ sơ bệnh án
   * @returns {Promise<Number>} Tổng tiền thuốc
   */
  static async calculateTotalMedicineFee(medicalRecordId) {
    const query = `
      SELECT SUM(m.price * p.quantity) as total_fee
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      WHERE p.medical_record_id = $1
    `;
    
    const { rows } = await db.query(query, [medicalRecordId]);
    
    return parseFloat(rows[0].total_fee) || 0;
  }
}

module.exports = Prescription;
