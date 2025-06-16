const Joi = require('joi');

// Custom validators
const currentYear = new Date().getFullYear();
const validGenders = ['Nam', 'Nữ', 'Khác'];

// Regex cho số điện thoại Việt Nam
const phoneRegex = /^(\+?84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)([0-9]{7})$/;

/**
 * Schema validation cho Patients API
 * Bảng patients trong SQL:
 * - id: SERIAL PRIMARY KEY
 * - full_name: VARCHAR(100) NOT NULL
 * - gender: VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác'))
 * - birth_year: INTEGER CHECK (birth_year > 1900)
 * - phone: VARCHAR(20) UNIQUE
 * - address: TEXT
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */

// Base schema cho patient
const basePatientSchema = {
  full_name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    }),

  gender: Joi.string()
    .valid(...validGenders)
    .required()
    .messages({
      'string.empty': 'Giới tính không được để trống',
      'any.only': `Giới tính phải là một trong các giá trị: ${validGenders.join(', ')}`,
      'any.required': 'Giới tính là bắt buộc'
    }),

  birth_year: Joi.number()
    .integer()
    .min(1900)
    .max(currentYear)
    .required()
    .messages({
      'number.base': 'Năm sinh phải là số nguyên',
      'number.integer': 'Năm sinh phải là số nguyên',
      'number.min': `Năm sinh phải lớn hơn hoặc bằng 1900`,
      'number.max': `Năm sinh không được lớn hơn năm hiện tại (${currentYear})`,
      'any.required': 'Năm sinh là bắt buộc'
    }),

  phone: Joi.string()
    .trim()
    .pattern(phoneRegex)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (định dạng: 09xxxxxxxx hoặc 03xxxxxxxx)'
    }),

  address: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Địa chỉ không được quá 500 ký tự'
    })
};

// Schema cho tạo bệnh nhân mới
const createPatientSchema = Joi.object({
  ...basePatientSchema
});

// Schema cho cập nhật bệnh nhân
const updatePatientSchema = Joi.object({
  full_name: Joi.string()
    .max(100)
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.max': 'Họ tên không được quá 100 ký tự'
    }),

  gender: Joi.string()
    .valid(...validGenders)
    .messages({
      'string.empty': 'Giới tính không được để trống',
      'any.only': `Giới tính phải là một trong các giá trị: ${validGenders.join(', ')}`
    }),

  birth_year: Joi.number()
    .integer()
    .min(1900)
    .max(currentYear)
    .messages({
      'number.base': 'Năm sinh phải là số nguyên',
      'number.integer': 'Năm sinh phải là số nguyên',
      'number.min': `Năm sinh phải lớn hơn hoặc bằng 1900`,
      'number.max': `Năm sinh không được lớn hơn năm hiện tại (${currentYear})`
    }),

  phone: Joi.string()
    .pattern(phoneRegex)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (định dạng: 09xxxxxxxx hoặc 03xxxxxxxx)'
    }),

  address: Joi.string()
    .allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

const patientSchema = {
  createPatientSchema,
  updatePatientSchema
};

module.exports = patientSchema;
