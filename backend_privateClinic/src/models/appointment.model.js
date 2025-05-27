const db = require('../config/db');
const { NotFoundError, DatabaseError } = require('../utils/apiError');

/**
 * Appointment Model
 * Quản lý thao tác với bảng appointment_lists
 */
class Appointment {
  /**
   * Lấy danh sách lịch hẹn
   * @param {Object} options - Các tùy chọn lọc và phân trang
   * @returns {Promise<Array>} Danh sách lịch hẹn
   */
  static async findAll(options = {}) {
    const { 
      date, 
      status, 
      patientId,
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        a.id, a.patient_id, a.appointment_date, a.appointment_time, 
        a.order_number, a.status, a.notes, a.created_at, a.updated_at,
        p.full_name as patient_name, p.gender, p.birth_year, p.phone
      FROM appointment_lists a
      JOIN patients p ON a.patient_id = p.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM appointment_lists a
      JOIN patients p ON a.patient_id = p.id
    `;
    
    const queryParams = [];
    let conditions = [];
    
    // Thêm điều kiện lọc
    if (date) {
      queryParams.push(date);
      conditions.push(`a.appointment_date = $${queryParams.length}`);
    }
    
    if (status) {
      queryParams.push(status);
      conditions.push(`a.status = $${queryParams.length}`);
    }
    
    if (patientId) {
      queryParams.push(patientId);
      conditions.push(`a.patient_id = $${queryParams.length}`);
    }
    
    // Thêm WHERE nếu có điều kiện lọc
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp và phân trang
    query += ` 
      ORDER BY a.appointment_date, a.order_number
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
   * Lấy danh sách lịch hẹn theo ngày
   * @param {String} date - Ngày cần lấy lịch hẹn (YYYY-MM-DD)
   * @returns {Promise<Array>} Danh sách lịch hẹn trong ngày
   */
  static async findByDate(date) {
    const query = `
      SELECT 
        a.id, a.patient_id, a.appointment_date, a.appointment_time, 
        a.order_number, a.status, a.notes, a.created_at, a.updated_at,
        p.full_name as patient_name, p.gender, p.birth_year, p.phone
      FROM appointment_lists a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.appointment_date = $1
      ORDER BY a.order_number
    `;
    
    const { rows } = await db.query(query, [date]);
    
    return rows;
  }
  
  /**
   * Tìm lịch hẹn theo ID
   * @param {Number} id - ID của lịch hẹn
   * @returns {Promise<Object>} Thông tin lịch hẹn
   */
  static async findById(id) {
    const query = `
      SELECT 
        a.id, a.patient_id, a.appointment_date, a.appointment_time, 
        a.order_number, a.status, a.notes, a.created_at, a.updated_at,
        p.full_name as patient_name, p.gender, p.birth_year, p.phone
      FROM appointment_lists a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy lịch hẹn');
    }
    
    return rows[0];
  }
  
  /**
   * Lấy thông tin giới hạn lịch hẹn
   * @returns {Promise<Object>} Thông tin giới hạn
   */
  static async getAppointmentLimits() {
    // Lấy số lượng tối đa bệnh nhân mỗi ngày
    const maxPatients = await this.getMaxPatientsPerDay();
    
    // Lấy các thông tin hạn chế khác nếu cần
    
    return {
      maxPatientsPerDay: maxPatients,
      avgExaminationTime: 30, // Thời gian khám trung bình (phút)
    };
  }
  
  /**
   * Tạo lịch hẹn mới
   * @param {Object} data - Dữ liệu lịch hẹn
   * @returns {Promise<Object>} Lịch hẹn mới tạo
   */
  static async create(data) {
    try {
      const { 
        patient_id, 
        appointment_date, 
        appointment_time, 
        notes 
      } = data;
      
      // Lấy số thứ tự tiếp theo trong ngày
      const orderQuery = `
        SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
        FROM appointment_lists
        WHERE appointment_date = $1
      `;
      
      const orderResult = await db.query(orderQuery, [appointment_date]);
      const order_number = orderResult.rows[0].next_order;
      
      // Tạo lịch hẹn mới
      const query = `
        INSERT INTO appointment_lists 
          (patient_id, appointment_date, appointment_time, order_number, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, patient_id, appointment_date, appointment_time, order_number, status, notes, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        patient_id, 
        appointment_date, 
        appointment_time, 
        order_number, 
        'waiting', // Trạng thái mặc định là waiting
        notes
      ]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger check_max_patients_per_day
      if (error.code === 'P0001' && error.message.includes('Số lượng bệnh nhân trong ngày đã đạt tối đa')) {
        throw new DatabaseError(
          'Số lượng bệnh nhân trong ngày đã đạt tối đa',
          error.detail,
          error.hint
        );
      }
      
      // Xử lý lỗi ràng buộc duy nhất
      if (error.code === '23505') {
        // Xác định loại ràng buộc duy nhất bị vi phạm
        if (error.constraint === 'appointment_lists_patient_id_appointment_date_key') {
          throw new DatabaseError(
            'Bệnh nhân đã có lịch hẹn trong ngày này',
            'Mỗi bệnh nhân chỉ được đặt một lịch hẹn trong một ngày',
            'Vui lòng chọn ngày khác hoặc hủy lịch hẹn cũ'
          );
        }
        
        if (error.constraint === 'appointment_lists_appointment_date_appointment_time_key') {
          throw new DatabaseError(
            'Thời gian đã có lịch hẹn khác',
            `Thời gian ${appointment_time} ngày ${appointment_date} đã có lịch hẹn khác`,
            'Vui lòng chọn thời gian khác'
          );
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Cập nhật lịch hẹn
   * @param {Number} id - ID của lịch hẹn
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Lịch hẹn sau khi cập nhật
   */
  static async update(id, data) {
    try {
      // Kiểm tra lịch hẹn tồn tại
      const currentAppointment = await this.findById(id);
      
      const { 
        appointment_date = currentAppointment.appointment_date, 
        appointment_time = currentAppointment.appointment_time, 
        status, 
        notes 
      } = data;
      
      const query = `
        UPDATE appointment_lists
        SET 
          appointment_date = COALESCE($1, appointment_date),
          appointment_time = COALESCE($2, appointment_time),
          status = COALESCE($3, status),
          notes = COALESCE($4, notes)
        WHERE id = $5
        RETURNING id, patient_id, appointment_date, appointment_time, order_number, status, notes, created_at, updated_at
      `;
      
      const { rows } = await db.query(query, [
        appointment_date, 
        appointment_time, 
        status, 
        notes, 
        id
      ]);
      
      return rows[0];
    } catch (error) {
      // Xử lý lỗi từ trigger
      if (error.code === 'P0001') {
        throw new DatabaseError(
          error.message,
          error.detail,
          error.hint
        );
      }
      
      // Xử lý lỗi ràng buộc duy nhất
      if (error.code === '23505') {
        // Xác định loại ràng buộc duy nhất bị vi phạm
        if (error.constraint === 'appointment_lists_patient_id_appointment_date_key') {
          throw new DatabaseError(
            'Bệnh nhân đã có lịch hẹn trong ngày này',
            'Mỗi bệnh nhân chỉ được đặt một lịch hẹn trong một ngày',
            'Vui lòng chọn ngày khác hoặc hủy lịch hẹn cũ'
          );
        }
        
        if (error.constraint === 'appointment_lists_appointment_date_appointment_time_key') {
          throw new DatabaseError(
            'Thời gian đã có lịch hẹn khác',
            `Thời gian ${appointment_time} ngày ${appointment_date} đã có lịch hẹn khác`,
            'Vui lòng chọn thời gian khác'
          );
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Hủy lịch hẹn
   * @param {Number} id - ID của lịch hẹn
   * @param {String} reason - Lý do hủy
   * @returns {Promise<Object>} Lịch hẹn sau khi hủy
   */
  static async cancelAppointment(id, reason) {
    // Kiểm tra lịch hẹn tồn tại và lấy thông tin hiện tại
    const currentAppointment = await this.findById(id);
    
    // Kiểm tra nếu lịch hẹn đã bị hủy trước đó
    if (currentAppointment.status === 'cancelled') {
      throw new ValidationError('Lịch hẹn đã được hủy trước đó');
    }
    
    // Kiểm tra nếu lịch hẹn đã hoàn thành
    if (currentAppointment.status === 'completed') {
      throw new ValidationError('Không thể hủy lịch hẹn đã hoàn thành');
    }
    
    const query = `
      UPDATE appointment_lists
      SET 
        status = 'cancelled',
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, patient_id, appointment_date, appointment_time, 
        order_number, status, notes, cancellation_reason,
        created_at, updated_at
    `;
    
    const { rows } = await db.query(query, [reason, id]);
    
    if (rows.length === 0) {
      throw new NotFoundError('Không tìm thấy lịch hẹn');
    }
    
    return rows[0];
  }
  
  /**
   * Lấy số lượng bệnh nhân tối đa mỗi ngày từ cài đặt
   * @returns {Promise<Number>} Số lượng tối đa
   */
  static async getMaxPatientsPerDay() {
    const query = `
      SELECT value::INTEGER as max_patients
      FROM settings
      WHERE key = 'max_patients_per_day'
    `;
    
    const { rows } = await db.query(query);
    
    if (rows.length === 0) {
      return 40; // Giá trị mặc định
    }
    
    return rows[0].max_patients;
  }
  
  /**
   * Lấy số lượng bệnh nhân hiện tại trong ngày
   * @param {String} date - Ngày cần kiểm tra (YYYY-MM-DD)
   * @returns {Promise<Number>} Số lượng hiện tại
   */
  static async getCurrentPatientCount(date) {
    const query = `
      SELECT COUNT(*) as count
      FROM appointment_lists
      WHERE appointment_date = $1
    `;
    
    const { rows } = await db.query(query, [date]);
    
    return parseInt(rows[0].count);
  }

  /**
   * Kiểm tra xem đã có lịch hẹn nào trùng thời gian với bác sĩ chưa
   * @param {Number} staffId - ID của bác sĩ
   * @param {String} appointmentDate - Ngày hẹn (YYYY-MM-DD)
   * @param {String} appointmentTime - Giờ hẹn (HH:MM:SS)
   * @param {Number} [excludeId=null] - ID lịch hẹn cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async isTimeSlotBooked(staffId, appointmentDate, appointmentTime, excludeId = null) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM appointment_lists al
        JOIN medical_records mr ON al.id = mr.appointment_id
        WHERE mr.staff_id = $1 
          AND al.appointment_date = $2 
          AND al.appointment_time = $3
          AND al.status != 'cancelled'
          ${excludeId ? 'AND al.id != $4' : ''}
      ) as exists
    `;
    
    const params = [staffId, appointmentDate, appointmentTime];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }

  /**
   * Kiểm tra xem bệnh nhân đã có lịch hẹn nào trong khoảng thời gian chưa
   * @param {Number} patientId - ID của bệnh nhân
   * @param {String} appointmentDate - Ngày hẹn (YYYY-MM-DD)
   * @param {Number} [excludeId=null] - ID lịch hẹn cần loại trừ (dùng khi cập nhật)
   * @returns {Promise<Boolean>} true nếu đã tồn tại, false nếu chưa
   */
  static async hasPatientAppointment(patientId, appointmentDate, excludeId = null) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM appointment_lists
        WHERE patient_id = $1 
          AND appointment_date = $2
          AND status != 'cancelled'
          ${excludeId ? 'AND id != $3' : ''}
      ) as exists
    `;
    
    const params = [patientId, appointmentDate];
    if (excludeId) params.push(excludeId);
    
    const { rows } = await db.query(query, params);
    return rows[0].exists;
  }
}

module.exports = Appointment;
