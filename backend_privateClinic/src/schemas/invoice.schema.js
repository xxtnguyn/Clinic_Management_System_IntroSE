const Joi = require('joi');

// Danh sách các trạng thái hóa đơn hợp lệ
const VALID_INVOICE_STATUSES = ['pending', 'paid', 'cancelled'];

// Base schema cho hóa đơn
const baseInvoiceSchema = {
  medical_record_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID hồ sơ y tế phải là số',
      'number.integer': 'ID hồ sơ y tế phải là số nguyên',
      'number.min': 'ID hồ sơ y tế phải lớn hơn 0',
      'any.required': 'ID hồ sơ y tế là bắt buộc'
    }),

  staff_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID nhân viên phải là số',
      'number.integer': 'ID nhân viên phải là số nguyên',
      'number.min': 'ID nhân viên phải lớn hơn 0',
      'any.required': 'ID nhân viên là bắt buộc'
    }),

  examination_fee: Joi.number()
    .precision(2)
    .min(0)
    .default(30000)
    .messages({
      'number.base': 'Phí khám phải là số',
      'number.precision': 'Phí khám chỉ được có tối đa 2 chữ số thập phân',
      'number.min': 'Phí khám không được nhỏ hơn 0'
    }),

  medicine_fee: Joi.number()
    .precision(2)
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Phí thuốc phải là số',
      'number.precision': 'Phí thuốc chỉ được có tối đa 2 chữ số thập phân',
      'number.min': 'Phí thuốc không được nhỏ hơn 0'
    }),

  payment_date: Joi.date()
    .iso()
    .messages({
      'date.base': 'Ngày thanh toán không hợp lệ',
      'date.format': 'Ngày thanh toán phải có định dạng ISO 8601'
    }),

  status: Joi.string()
    .valid(...VALID_INVOICE_STATUSES)
    .required()
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_INVOICE_STATUSES.join(', ')}`,
      'any.required': 'Trạng thái là bắt buộc'
    }),

  notes: Joi.string().allow('', null)
};

// Schema cho tạo hóa đơn mới
const createInvoiceSchema = Joi.object({
  ...baseInvoiceSchema
});

// Schema cho cập nhật hóa đơn
const updateInvoiceSchema = Joi.object({
  examination_fee: Joi.number()
    .precision(2)
    .min(0)
    .messages({
      'number.base': 'Phí khám phải là số',
      'number.precision': 'Phí khám chỉ được có tối đa 2 chữ số thập phân',
      'number.min': 'Phí khám không được nhỏ hơn 0'
    }),

  medicine_fee: Joi.number()
    .precision(2)
    .min(0)
    .messages({
      'number.base': 'Phí thuốc phải là số',
      'number.precision': 'Phí thuốc chỉ được có tối đa 2 chữ số thập phân',
      'number.min': 'Phí thuốc không được nhỏ hơn 0'
    }),

  payment_date: Joi.date()
    .iso()
    .messages({
      'date.base': 'Ngày thanh toán không hợp lệ',
      'date.format': 'Ngày thanh toán phải có định dạng ISO 8601'
    }),

  status: Joi.string()
    .valid(...VALID_INVOICE_STATUSES)
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_INVOICE_STATUSES.join(', ')}`
    }),

  notes: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho thanh toán hóa đơn
const processPaymentSchema = Joi.object({
  status: Joi.string()
    .valid('paid')
    .required()
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': 'Trạng thái phải là "paid" để xử lý thanh toán',
      'any.required': 'Trạng thái là bắt buộc'
    }),

  payment_date: Joi.date()
    .iso()
    .messages({
      'date.base': 'Ngày thanh toán không hợp lệ',
      'date.format': 'Ngày thanh toán phải có định dạng ISO 8601'
    })
});

const invoiceSchema = {
  createInvoiceSchema,
  updateInvoiceSchema,
  processPaymentSchema
};

module.exports = invoiceSchema;
