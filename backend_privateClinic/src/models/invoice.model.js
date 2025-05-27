const db = require('../config/db');
const Prescription = require('./prescription.model');
const Setting = require('./setting.model');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * Invoice Model
 * Quản lý thao tác với bảng invoices
 */
class Invoice {
  /**
   * Lấy danh sách hóa đơn
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách hóa đơn
   */
  static async findAll(options = {}) {
    const { 
      medicalRecordId, 
      patientId,
      staffId, 
      status,
      startDate,
      endDate,
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        i.id, i.medical_record_id, i.staff_id,
        i.examination_fee, i.medicine_fee, i.total_fee,
        i.payment_date, i.status, i.notes,
        i.created_at, i.updated_at,
        s.full_name as staff_name,
        mr.patient_id, mr.examination_date,
        p.full_name as patient_name
      FROM invoices i
      JOIN staff s ON i.staff_id = s.id
      JOIN medical_records mr ON i.medical_record_id = mr.id
      JOIN patients p ON mr.patient_id = p.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.id
    `;
    
    const queryParams = [];
    let conditions = [];
    
    // Thêm điều kiện lọc
    if (medicalRecordId) {
      queryParams.push(medicalRecordId);
      conditions.push(`i.medical_record_id = $${queryParams.length}`);
    }
    
    if (patientId) {
      queryParams.push(patientId);
      conditions.push(`mr.patient_id = $${queryParams.length}`);
    }
    
    if (staffId) {
      queryParams.push(staffId);
      conditions.push(`i.staff_id = $${queryParams.length}`);
    }
    
    if (status) {
      queryParams.push(status);
      conditions.push(`i.status = $${queryParams.length}`);
    }
    
    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      conditions.push(`i.payment_date BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
    } else if (startDate) {
      queryParams.push(startDate);
      conditions.push(`i.payment_date >= $${queryParams.length}`);
    } else if (endDate) {
      queryParams.push(endDate);
      conditions.push(`i.payment_date <= $${queryParams.length}`);
    }
    
    // Thêm WHERE nếu có điều kiện lọc
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp và phân trang
    query += ` 
      ORDER BY i.payment_date DESC
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
   * Tìm hóa đơn theo ID
   * @param {Number} id - ID của hóa đơn
   * @returns {Promise<Object>} Thông tin hóa đơn
   */
  static async findById(id) {
    const query = `
      SELECT 
        i.id, i.medical_record_id, i.staff_id,
        i.examination_fee, i.medicine_fee, i.total_fee,
        i.payment_date, i.status, i.notes,
        i.created_at, i.updated_at,
        s.full_name as staff_name,
        mr.patient_id, mr.examination_date,
        p.full_name as patient_name
      FROM invoices i
      JOIN staff s ON i.staff_id = s.id
      JOIN medical_records mr ON i.medical_record_id = mr.id
      JOIN patients p ON mr.patient_id = p.id
      WHERE i.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy hóa đơn');
    }
    
    return rows[0];
  }
  
  /**
   * Tìm hóa đơn theo ID hồ sơ bệnh án
   * @param {Number} medicalRecordId - ID của hồ sơ bệnh án
   * @returns {Promise<Object>} Thông tin hóa đơn
   */
  static async findByMedicalRecordId(medicalRecordId) {
    const query = `
      SELECT 
        i.id, i.medical_record_id, i.staff_id,
        i.examination_fee, i.medicine_fee, i.total_fee,
        i.payment_date, i.status, i.notes,
        i.created_at, i.updated_at
      FROM invoices i
      WHERE i.medical_record_id = $1
    `;
    
    const { rows } = await db.query(query, [medicalRecordId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  }
  
  /**
   * Tạo hóa đơn mới
   * @param {Object} data - Dữ liệu hóa đơn
   * @returns {Promise<Object>} Hóa đơn mới tạo
   */
  static async create(data) {
    try {
      // Kiểm tra hồ sơ bệnh án đã có hóa đơn chưa
      const existingInvoice = await this.findByMedicalRecordId(data.medical_record_id);
      if (existingInvoice) {
        throw new DatabaseError(
          'Hồ sơ bệnh án này đã có hóa đơn',
          `Invoice ID: ${existingInvoice.id}`,
          'Vui lòng cập nhật hóa đơn hiện có thay vì tạo mới'
        );
      }
      
      const { 
        medical_record_id, 
        staff_id, 
        status = 'pending',
        notes 
      } = data;
      
      // Lấy phí khám từ settings thay vì từ input
      const examination_fee = await Setting.getValue('examination_fee', 30000);
      
      // Tính tổng tiền thuốc từ đơn thuốc
      const medicineFee = await Prescription.calculateTotalMedicineFee(medical_record_id);
      
      const query = `
        INSERT INTO invoices (
          medical_record_id, staff_id, examination_fee,
          medicine_fee, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, medical_record_id, staff_id,
                  examination_fee, medicine_fee, total_fee,
                  payment_date, status, notes, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        medical_record_id, 
        staff_id, 
        examination_fee,
        medicineFee,
        status,
        notes
      ]);
      
      return rows[0];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw error;
    }
  }
  
  /**
   * Cập nhật hóa đơn
   * @param {Number} id - ID của hóa đơn
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Hóa đơn sau khi cập nhật
   */
  static async update(id, data) {
    // Kiểm tra hóa đơn tồn tại
    await this.findById(id);
    
    const { 
      status,
      notes 
    } = data;
    
    // Cập nhật hóa đơn (loại bỏ examination_fee khỏi các trường có thể cập nhật)
    const query = `
      UPDATE invoices
      SET 
        status = COALESCE($1, status),
        notes = COALESCE($2, notes)
      WHERE id = $3
      RETURNING id, medical_record_id, staff_id,
                examination_fee, medicine_fee, total_fee,
                payment_date, status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [
      status,
      notes,
      id
    ]);
    
    return rows[0];
  }
  
  /**
   * Thanh toán hóa đơn
   * @param {Number} id - ID của hóa đơn
   * @returns {Promise<Object>} Hóa đơn sau khi thanh toán
   */
  static async processPayment(id) {
    // Kiểm tra hóa đơn tồn tại
    const invoice = await this.findById(id);
    
    if (invoice.status === 'paid') {
      throw new DatabaseError(
        'Hóa đơn này đã được thanh toán',
        `Invoice ID: ${id}, Thời gian thanh toán: ${invoice.payment_date}`,
        'Không thể thanh toán lại hóa đơn đã thanh toán'
      );
    }
    
    if (invoice.status === 'cancelled') {
      throw new DatabaseError(
        'Không thể thanh toán hóa đơn đã hủy',
        `Invoice ID: ${id}`,
        'Vui lòng tạo hóa đơn mới'
      );
    }
    
    // Thanh toán hóa đơn
    const query = `
      UPDATE invoices
      SET 
        status = 'paid',
        payment_date = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, medical_record_id, staff_id,
                examination_fee, medicine_fee, total_fee,
                payment_date, status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [id]);
    
    return rows[0];
  }
  
  /**
   * Hủy hóa đơn
   * @param {Number} id - ID của hóa đơn
   * @returns {Promise<Object>} Hóa đơn sau khi hủy
   */
  static async cancelInvoice(id) {
    // Kiểm tra hóa đơn tồn tại
    const invoice = await this.findById(id);
    
    if (invoice.status === 'paid') {
      throw new DatabaseError(
        'Không thể hủy hóa đơn đã thanh toán',
        `Invoice ID: ${id}, Thời gian thanh toán: ${invoice.payment_date}`,
        'Vui lòng hoàn tiền trước khi hủy hóa đơn'
      );
    }
    
    // Hủy hóa đơn
    const query = `
      UPDATE invoices
      SET 
        status = 'cancelled',
        payment_date = NULL
      WHERE id = $1
      RETURNING id, medical_record_id, staff_id,
                examination_fee, medicine_fee, total_fee,
                payment_date, status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [id]);
    
    return rows[0];
  }
  
  /**
   * Lấy báo cáo doanh thu theo ngày
   * @param {String} date - Ngày cần lấy báo cáo (YYYY-MM-DD)
   * @returns {Promise<Object>} Báo cáo doanh thu
   */
  static async getDailyRevenue(date) {
    const query = `
      SELECT 
        payment_date::DATE AS date,
        COUNT(*) AS patient_count,
        SUM(examination_fee) AS examination_fee_total,
        SUM(medicine_fee) AS medicine_fee_total,
        SUM(total_fee) AS total_revenue
      FROM invoices
      WHERE payment_date::DATE = $1 AND status = 'paid'
      GROUP BY payment_date::DATE
    `;
    
    const { rows } = await db.query(query, [date]);
    
    if (rows.length === 0) {
      return {
        date,
        patient_count: 0,
        examination_fee_total: 0,
        medicine_fee_total: 0,
        total_revenue: 0
      };
    }
    
    return rows[0];
  }
  
  /**
   * Lấy báo cáo doanh thu theo tháng
   * @param {Number} month - Tháng (1-12)
   * @param {Number} year - Năm
   * @returns {Promise<Array>} Báo cáo doanh thu
   */
  static async getMonthlyRevenue(month, year) {
    const query = `
      SELECT * FROM get_monthly_revenue($1, $2)
    `;
    
    const { rows } = await db.query(query, [month, year]);
    
    return rows;
  }
}

module.exports = Invoice;
