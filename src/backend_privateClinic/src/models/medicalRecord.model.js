const db = require('../config/db');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * MedicalRecord Model
 * Quản lý thao tác với bảng medical_records
 */
class MedicalRecord {
  /**
   * Lấy danh sách hồ sơ bệnh án
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách hồ sơ bệnh án
   */
  static async findAll(options = {}) {
    const { 
      patientId,
      staffId, 
      startDate,
      endDate,
      diseaseTypeId,
      status,
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        mr.id, mr.patient_id, mr.staff_id, mr.examination_date, 
        mr.symptoms, mr.diagnosis, mr.disease_type_id, mr.status, 
        mr.notes, mr.created_at, mr.updated_at,
        p.full_name as patient_name,
        s.full_name as staff_name,
        dt.name as disease_type_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN staff s ON mr.staff_id = s.id
      JOIN disease_types dt ON mr.disease_type_id = dt.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN staff s ON mr.staff_id = s.id
      JOIN disease_types dt ON mr.disease_type_id = dt.id
    `;
    
    const queryParams = [];
    let conditions = [];
    
    // Thêm điều kiện lọc
    if (patientId) {
      queryParams.push(patientId);
      conditions.push(`mr.patient_id = $${queryParams.length}`);
    }
    
    if (staffId) {
      queryParams.push(staffId);
      conditions.push(`mr.staff_id = $${queryParams.length}`);
    }
    
    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      conditions.push(`mr.examination_date BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
    } else if (startDate) {
      queryParams.push(startDate);
      conditions.push(`mr.examination_date >= $${queryParams.length}`);
    } else if (endDate) {
      queryParams.push(endDate);
      conditions.push(`mr.examination_date <= $${queryParams.length}`);
    }
    
    if (diseaseTypeId) {
      queryParams.push(diseaseTypeId);
      conditions.push(`mr.disease_type_id = $${queryParams.length}`);
    }
    
    if (status) {
      queryParams.push(status);
      conditions.push(`mr.status = $${queryParams.length}`);
    }
    
    // Thêm WHERE nếu có điều kiện lọc
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp và phân trang
    query += ` 
      ORDER BY mr.examination_date DESC
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
   * Tìm hồ sơ bệnh án theo ID
   * @param {Number} id - ID của hồ sơ bệnh án
   * @returns {Promise<Object>} Thông tin hồ sơ bệnh án
   */
  static async findById(id) {
    const query = `
      SELECT 
        mr.id, mr.patient_id, mr.staff_id, mr.examination_date, 
        mr.symptoms, mr.diagnosis, mr.disease_type_id, mr.status, 
        mr.notes, mr.created_at, mr.updated_at,
        p.full_name as patient_name,
        s.full_name as staff_name,
        dt.name as disease_type_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN staff s ON mr.staff_id = s.id
      JOIN disease_types dt ON mr.disease_type_id = dt.id
      WHERE mr.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy hồ sơ bệnh án');
    }
    
    return rows[0];
  }
  
  /**
   * Tạo hồ sơ bệnh án mới
   * @param {Object} data - Dữ liệu hồ sơ bệnh án
   * @returns {Promise<Object>} Hồ sơ bệnh án mới tạo
   */
  static async create(data) {
    const { 
      patient_id, 
      staff_id, 
      examination_date, 
      symptoms, 
      diagnosis, 
      disease_type_id, 
      status = 'pending', 
      notes 
    } = data;
    
    const query = `
      INSERT INTO medical_records (
        patient_id, staff_id, examination_date, 
        symptoms, diagnosis, disease_type_id, 
        status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, patient_id, staff_id, examination_date, 
                symptoms, diagnosis, disease_type_id, 
                status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [
      patient_id, 
      staff_id, 
      examination_date, 
      symptoms, 
      diagnosis, 
      disease_type_id, 
      status, 
      notes
    ]);
    
    return rows[0];
  }
  
  /**
   * Cập nhật hồ sơ bệnh án
   * @param {Number} id - ID của hồ sơ bệnh án
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Hồ sơ bệnh án sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra hồ sơ bệnh án tồn tại
    await this.findById(id);
    
    const { 
      examination_date, 
      symptoms, 
      diagnosis, 
      disease_type_id, 
      status, 
      notes 
    } = data;
    
    const query = `
      UPDATE medical_records
      SET 
        examination_date = COALESCE($1, examination_date),
        symptoms = COALESCE($2, symptoms),
        diagnosis = COALESCE($3, diagnosis),
        disease_type_id = COALESCE($4, disease_type_id),
        status = COALESCE($5, status),
        notes = COALESCE($6, notes)
      WHERE id = $7
      RETURNING id, patient_id, staff_id, examination_date, 
                symptoms, diagnosis, disease_type_id, 
                status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [
      examination_date, 
      symptoms, 
      diagnosis, 
      disease_type_id, 
      status, 
      notes, 
      id
    ]);
    
    return rows[0];
  }
  
  /**
   * Xóa hồ sơ bệnh án
   * @param {Number} id - ID của hồ sơ bệnh án
   * @returns {Promise<Boolean>} Kết quả xóa
   */
  static async delete(id) {
    // Kiểm tra hồ sơ bệnh án tồn tại
    await this.findById(id);
    
    try {
      const query = 'DELETE FROM medical_records WHERE id = $1';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new DatabaseError(
          'Không thể xóa hồ sơ bệnh án này vì đã có dữ liệu liên quan',
          'Hồ sơ bệnh án đã có đơn thuốc hoặc hóa đơn liên quan',
          'Vui lòng xóa các dữ liệu liên quan trước khi xóa hồ sơ bệnh án này'
        );
      }
      throw error;
    }
  }
  
  /**
   * Lấy đơn thuốc của hồ sơ bệnh án
   * @param {Number} id - ID của hồ sơ bệnh án
   * @returns {Promise<Array>} Danh sách đơn thuốc
   */
  static async getPrescriptions(id) {
    // Kiểm tra hồ sơ bệnh án tồn tại
    await this.findById(id);
    
    const query = `
      SELECT 
        p.id, p.medical_record_id, p.medicine_id, p.staff_id,
        p.quantity, p.usage_instruction_id, p.notes,
        p.created_at, p.updated_at,
        m.name as medicine_name, m.unit as medicine_unit, 
        m.price as medicine_price,
        ui.instruction as usage_instruction,
        s.full_name as staff_name
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      JOIN usage_instructions ui ON p.usage_instruction_id = ui.id
      JOIN staff s ON p.staff_id = s.id
      WHERE p.medical_record_id = $1
      ORDER BY p.id
    `;
    
    const { rows } = await db.query(query, [id]);
    
    return rows;
  }
  
  /**
   * Lấy hóa đơn của hồ sơ bệnh án
   * @param {Number} id - ID của hồ sơ bệnh án
   * @returns {Promise<Object>} Thông tin hóa đơn
   */
  static async getInvoice(id) {
    // Kiểm tra hồ sơ bệnh án tồn tại
    await this.findById(id);
    
    const query = `
      SELECT 
        i.id, i.medical_record_id, i.staff_id,
        i.examination_fee, i.medicine_fee, i.total_fee,
        i.payment_date, i.status, i.notes,
        i.created_at, i.updated_at,
        s.full_name as staff_name
      FROM invoices i
      JOIN staff s ON i.staff_id = s.id
      WHERE i.medical_record_id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  }
}

module.exports = MedicalRecord;
