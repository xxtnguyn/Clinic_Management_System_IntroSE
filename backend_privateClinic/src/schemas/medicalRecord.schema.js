const Joi = require('joi');

// Danh sách các trạng thái hợp lệ cho hồ sơ y tế
const VALID_MEDICAL_RECORD_STATUSES = ['pending', 'completed', 'cancelled'];

// Base schema cho hồ sơ y tế
const baseMedicalRecordSchema = {
  patient_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID bệnh nhân phải là số',
      'number.integer': 'ID bệnh nhân phải là số nguyên',
      'number.min': 'ID bệnh nhân phải lớn hơn 0',
      'any.required': 'ID bệnh nhân là bắt buộc'
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

  examination_date: Joi.date()
    .required()
    .messages({
      'date.base': 'Ngày khám không hợp lệ',
      'any.required': 'Ngày khám là bắt buộc'
    }),

  symptoms: Joi.string().allow('', null),
  diagnosis: Joi.string().allow('', null),

  disease_type_id: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.base': 'ID loại bệnh phải là số',
      'number.integer': 'ID loại bệnh phải là số nguyên',
      'number.min': 'ID loại bệnh phải lớn hơn 0'
    }),

  status: Joi.string()
    .valid(...VALID_MEDICAL_RECORD_STATUSES)
    .required()
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_MEDICAL_RECORD_STATUSES.join(', ')}`,
      'any.required': 'Trạng thái là bắt buộc'
    }),

  notes: Joi.string().allow('', null)
};

// Schema cho tạo hồ sơ y tế mới
const createMedicalRecordSchema = Joi.object({
  ...baseMedicalRecordSchema
});

// Schema cho cập nhật hồ sơ y tế
const updateMedicalRecordSchema = Joi.object({
  examination_date: Joi.date()
    .messages({
      'date.base': 'Ngày khám không hợp lệ'
    }),
    
  symptoms: Joi.string().allow('', null),
  diagnosis: Joi.string().allow('', null),
  
  disease_type_id: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.base': 'ID loại bệnh phải là số',
      'number.integer': 'ID loại bệnh phải là số nguyên',
      'number.min': 'ID loại bệnh phải lớn hơn 0'
    }),
    
  status: Joi.string()
    .valid(...VALID_MEDICAL_RECORD_STATUSES)
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': `Trạng thái phải là một trong các giá trị: ${VALID_MEDICAL_RECORD_STATUSES.join(', ')}`
    }),
    
  notes: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

const medicalRecordSchema = {
  createMedicalRecordSchema,
  updateMedicalRecordSchema
};

module.exports = medicalRecordSchema;
