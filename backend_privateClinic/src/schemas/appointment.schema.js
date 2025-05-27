const Joi = require('joi');

// Danh sách các trạng thái hợp lệ cho lịch hẹn
const VALID_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

// Regex cho thời gian (HH:MM:SS)
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

// Regex cho ngày tháng (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;


// Hàm kiểm tra ngày không được là ngày trong quá khứ
const notPastDate = (value, helpers) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (new Date(value) < today) {
    return helpers.error('date.notPast');
  }
  return value;
};

// Hàm kiểm tra thời gian không được là quá khứ nếu là ngày hiện tại
const notPastTime = (value, helpers) => {
  const now = new Date();
  const today = new Date(now.toISOString().split('T')[0]);
  const appointmentDate = new Date(helpers.state.ancestors[0].appointment_date);
  
  // Nếu là ngày hôm nay
  if (appointmentDate.getTime() === today.getTime()) {
    const [hours, minutes] = value.split(':').map(Number);
    const appointmentTime = new Date();
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    if (appointmentTime < now) {
      return helpers.error('time.past');
    }
  }
  
  return value;
};

// Base schema cho lịch hẹn
const baseAppointmentSchema = {
  patientId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID bệnh nhân phải là số',
      'number.integer': 'ID bệnh nhân phải là số nguyên',
      'number.min': 'ID bệnh nhân phải lớn hơn 0',
      'any.required': 'ID bệnh nhân là bắt buộc'
    }),

  doctorId: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'ID bác sĩ phải là số',
      'number.integer': 'ID bác sĩ phải là số nguyên',
      'number.min': 'ID bác sĩ phải lớn hơn 0'
    }),

  appointmentDate: Joi.string()
    .pattern(DATE_REGEX)
    .required()
    .custom(notPastDate, 'Ngày không được là ngày trong quá khứ')
    .messages({
      'string.pattern.base': 'Ngày hẹn không hợp lệ (định dạng YYYY-MM-DD)',
      'any.required': 'Ngày hẹn là bắt buộc',
      'date.notPast': 'Ngày hẹn không được là ngày trong quá khứ'
    }),

  appointmentTime: Joi.string()
    .pattern(TIME_REGEX)
    .required()
    .custom(notPastTime, 'Thời gian không được là thời gian trong quá khứ')
    .messages({
      'string.pattern.base': 'Thời gian hẹn không hợp lệ (định dạng HH:MM hoặc HH:MM:SS)',
      'any.required': 'Thời gian hẹn là bắt buộc',
      'time.past': 'Thời gian hẹn không được là thời gian trong quá khứ'
    }),

  orderNumber: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Số thứ tự phải là số',
      'number.integer': 'Số thứ tự phải là số nguyên',
      'number.min': 'Số thứ tự phải lớn hơn 0',
      'any.required': 'Số thứ tự là bắt buộc'
    }),

  status: Joi.string()
    .valid(...VALID_APPOINTMENT_STATUSES)
    .required()
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_APPOINTMENT_STATUSES.join(', ')}`,
      'any.required': 'Trạng thái là bắt buộc'
    }),

  notes: Joi.string().allow('', null)
};

// Schema cho tạo lịch hẹn mới
const createAppointmentSchema = Joi.object({
  ...baseAppointmentSchema
});

// Schema cho cập nhật lịch hẹn
const updateAppointmentSchema = Joi.object({
  appointment_date: Joi.date()
    .custom(notPastDate, 'Ngày không được là ngày trong quá khứ')
    .messages({
      'date.base': 'Ngày hẹn không hợp lệ',
      'date.notPast': 'Ngày hẹn không được là ngày trong quá khứ'
    }),
    
  appointment_time: Joi.string()
    .pattern(TIME_REGEX)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Thời gian hẹn không hợp lệ (định dạng HH:MM:SS)'
    }),
    
  order_number: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Số thứ tự phải là số',
      'number.integer': 'Số thứ tự phải là số nguyên',
      'number.min': 'Số thứ tự phải lớn hơn 0'
    }),
    
  status: Joi.string()
    .valid(...VALID_APPOINTMENT_STATUSES)
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_APPOINTMENT_STATUSES.join(', ')}`
    }),
    
  notes: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho việc hủy lịch hẹn
const cancelAppointmentSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .required()
    .max(500)
    .messages({
      'string.empty': 'Vui lòng nhập lý do hủy lịch hẹn',
      'any.required': 'Lý do hủy lịch hẹn là bắt buộc',
      'string.max': 'Lý do không được vượt quá 500 ký tự'
    })
});

const appointmentSchema = {
  createAppointmentSchema,
  updateAppointmentSchema,
  cancelAppointmentSchema
};

module.exports = appointmentSchema;
