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
   * Cập nhật thông tin hóa đơn
   * @param {Number} id - ID của hóa đơn
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Hóa đơn sau khi cập nhật
   */
  static async update(id, data) {
    // Lấy thông tin hóa đơn hiện tại
    const currentInvoice = await this.findById(id);
    
    // Không cho phép cập nhật hóa đơn đã hủy
    if (currentInvoice.status === 'cancelled') {
      throw new DatabaseError(
        'Không thể cập nhật hóa đơn đã hủy',
        `Invoice ID: ${id}`,
        'Vui lòng tạo hóa đơn mới nếu cần thay đổi'
      );
    }
    
    const { status, notes } = data;
    
    // Nếu đang cập nhật status thành 'cancelled', sử dụng cancelInvoice
    if (status === 'cancelled') {
      return this.cancelInvoice(id);
    }
    
    // Nếu đang cập nhật status thành 'paid', sử dụng processPayment
    if (status === 'paid') {
      return this.processPayment(id);
    }
    
    // Nếu cố gắng thay đổi status nhưng không phải 'paid' hoặc 'cancelled'
    if (status && status !== currentInvoice.status) {
      throw new DatabaseError(
        'Trạng thái không hợp lệ',
        `Trạng thải hiện tại: ${currentInvoice.status}, Trạng thái mới: ${status}`,
        'Chỉ có thể cập nhật thành "paid" hoặc "cancelled" thông qua API tương ứng'
      );
    }
    
    // Chỉ cho phép cập nhật notes nếu có
    if (!notes) {
      return currentInvoice; // Không có gì để cập nhật
    }
    
    // Cập nhật notes
    const query = `
      UPDATE invoices
      SET 
        notes = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, medical_record_id, staff_id,
                examination_fee, medicine_fee, total_fee,
                payment_date, status, notes, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [notes, id]);
    
    return rows[0];
  }

  /**
   * Tạo hóa đơn mới
   * @param {Object} data - Dữ liệu hóa đơn
   * @returns {Promise<Object>} Hóa đơn mới tạo
   */
  static async create(data) {
    try {
      const { medical_record_id, staff_id, status = 'pending', notes } = data;
      
      // Lấy tất cả hóa đơn của hồ sơ bệnh án này, sắp xếp theo thời gian tạo mới nhất
      const existingInvoices = await db.query(
        `SELECT id, status, created_at 
         FROM invoices 
         WHERE medical_record_id = $1 
         ORDER BY created_at DESC`,
        [medical_record_id]
      );
      
      // Nếu đã có hóa đơn trước đó
      if (existingInvoices.rows.length > 0) {
        const latestInvoice = existingInvoices.rows[0];
        
        // Nếu hóa đơn gần nhất chưa bị hủy
        if (latestInvoice.status !== 'cancelled') {
          throw new DatabaseError(
            'Hồ sơ bệnh án này đã có hóa đơn đang hoạt động',
            `Invoice ID: ${latestInvoice.id}, Status: ${latestInvoice.status}`,
            'Vui lòng cập nhật hóa đơn hiện có hoặc hủy hóa đơn cũ trước khi tạo mới'
          );
        }
        
        // Nếu hóa đơn gần nhất đã bị hủy, cho phép tạo hóa đơn mới
        // Không cần thực hiện gì thêm
      }
      
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
  }
  
  // Chỉ cho phép cập nhật notes nếu status không thay đổi
  if (status && status !== currentInvoice.status) {
    throw new DatabaseError(
      'Không thể thay đổi trạng thái trực tiếp',
      `Sử dụng các API riêng cho thao tác thanh toán/hủy hóa đơn`
    );
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
        COUNT(*) AS patient_count,
        COALESCE(SUM(examination_fee), 0) AS examination_fee_total,
        COALESCE(SUM(medicine_fee), 0) AS medicine_fee_total,
        COALESCE(SUM(total_fee), 0) AS total_revenue
      FROM invoices
      WHERE 
        DATE(payment_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date
        AND status = 'paid'
    `;
    
    const { rows } = await db.query(query, [date]);
    
    // Thêm ngày vào kết quả
    if (rows.length > 0) {
      rows[0].date = date; // Sử dụng chính xác ngày được truyền vào
    } else {
      rows.push({
        date,
        patient_count: '0',
        examination_fee_total: '0.00',
        medicine_fee_total: '0.00',
        total_revenue: '0.00'
      });
    }
    
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
  /**
   * Lấy thông tin chi tiết của hóa đơn để xuất PDF
   * @param {Number} id - ID của hóa đơn
   * @returns {Promise<Object>} Thông tin chi tiết hóa đơn và đơn thuốc
   */
  static async getInvoiceDetailForPDF(id) {
    // Lấy thông tin chi tiết hóa đơn
    const invoiceQuery = `
      SELECT 
        i.id, i.examination_fee, i.medicine_fee, i.total_fee, 
        i.payment_date, i.status, i.notes, i.created_at,
        p.id as patient_id, p.full_name as patient_name, p.gender, 
        p.birth_year, p.phone, p.address,
        mr.id as medical_record_id, mr.symptoms, mr.diagnosis, 
        mr.examination_date, mr.notes as medical_notes,
        s.id as staff_id, s.full_name as staff_name, s.phone as staff_phone,
        dt.id as disease_type_id, dt.name as disease_name
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.id
      JOIN patients p ON mr.patient_id = p.id
      JOIN staff s ON i.staff_id = s.id
      LEFT JOIN disease_types dt ON mr.disease_type_id = dt.id
      WHERE i.id = $1
    `;
    
    const { rows } = await db.query(invoiceQuery, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy hóa đơn');
    }
    
    const invoice = rows[0];
    
    // Lấy thông tin đơn thuốc
    const prescriptionQuery = `
      SELECT 
        p.id as prescription_id, p.quantity, p.notes as prescription_notes,
        m.id as medicine_id, m.name as medicine_name, m.unit as medicine_unit, 
        m.price as medicine_price,
        ui.instruction as usage_instruction,
        (m.price * p.quantity) as subtotal
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      JOIN usage_instructions ui ON p.usage_instruction_id = ui.id
      WHERE p.medical_record_id = $1
      ORDER BY p.id
    `;
    
    const prescriptionResult = await db.query(prescriptionQuery, [invoice.medical_record_id]);
    
    // Lấy thông tin phòng khám từ settings
    const clinicInfoQueries = [
      db.query("SELECT value FROM settings WHERE key = 'clinic_name'"),
      db.query("SELECT value FROM settings WHERE key = 'clinic_address'"),
      db.query("SELECT value FROM settings WHERE key = 'clinic_phone'"),
      db.query("SELECT value FROM settings WHERE key = 'clinic_email'")
    ];
    
    const [nameResult, addressResult, phoneResult, emailResult] = await Promise.all(clinicInfoQueries);
    
    const clinicInfo = {
      name: nameResult.rows[0]?.value || 'PHÒNG KHÁM TƯ NHÂN',
      address: addressResult.rows[0]?.value || '149N Trung Ward, Thu Duc City, Ho Chi Minh City',
      phone: phoneResult.rows[0]?.value || '0123123123',
      email: emailResult.rows[0]?.value || 'ndcc.clinic@info.com'
    };
    
    return {
      invoice,
      prescriptions: prescriptionResult.rows,
      clinicInfo
    };
  }
}

module.exports = Invoice;