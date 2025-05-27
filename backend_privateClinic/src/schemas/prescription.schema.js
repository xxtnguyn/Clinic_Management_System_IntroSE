const Joi = require('joi');

// Base schema cho đơn thuốc
const basePrescriptionSchema = {
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

  medicine_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID thuốc phải là số',
      'number.integer': 'ID thuốc phải là số nguyên',
      'number.min': 'ID thuốc phải lớn hơn 0',
      'any.required': 'ID thuốc là bắt buộc'
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

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Số lượng thuốc phải là số',
      'number.integer': 'Số lượng thuốc phải là số nguyên',
      'number.min': 'Số lượng thuốc phải lớn hơn 0',
      'any.required': 'Số lượng thuốc là bắt buộc'
    }),

  usage_instruction_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID hướng dẫn sử dụng phải là số',
      'number.integer': 'ID hướng dẫn sử dụng phải là số nguyên',
      'number.min': 'ID hướng dẫn sử dụng phải lớn hơn 0',
      'any.required': 'ID hướng dẫn sử dụng là bắt buộc'
    }),

  notes: Joi.string().allow('', null)
};

// Schema cho tạo đơn thuốc mới
const createPrescriptionSchema = Joi.object({
  ...basePrescriptionSchema
});

// Schema cho cập nhật đơn thuốc
const updatePrescriptionSchema = Joi.object({
  medicine_id: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'ID thuốc phải là số',
      'number.integer': 'ID thuốc phải là số nguyên',
      'number.min': 'ID thuốc phải lớn hơn 0'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Số lượng thuốc phải là số',
      'number.integer': 'Số lượng thuốc phải là số nguyên',
      'number.min': 'Số lượng thuốc phải lớn hơn 0'
    }),

  usage_instruction_id: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'ID hướng dẫn sử dụng phải là số',
      'number.integer': 'ID hướng dẫn sử dụng phải là số nguyên',
      'number.min': 'ID hướng dẫn sử dụng phải lớn hơn 0'
    }),

  notes: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho tạo nhiều đơn thuốc cùng lúc (bulk create)
const bulkCreatePrescriptionSchema = Joi.object({
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

  prescriptions: Joi.array()
    .items(
      Joi.object({
        medicine_id: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.base': 'ID thuốc phải là số',
            'number.integer': 'ID thuốc phải là số nguyên',
            'number.min': 'ID thuốc phải lớn hơn 0',
            'any.required': 'ID thuốc là bắt buộc'
          }),

        quantity: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.base': 'Số lượng thuốc phải là số',
            'number.integer': 'Số lượng thuốc phải là số nguyên',
            'number.min': 'Số lượng thuốc phải lớn hơn 0',
            'any.required': 'Số lượng thuốc là bắt buộc'
          }),

        usage_instruction_id: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.base': 'ID hướng dẫn sử dụng phải là số',
            'number.integer': 'ID hướng dẫn sử dụng phải là số nguyên',
            'number.min': 'ID hướng dẫn sử dụng phải lớn hơn 0',
            'any.required': 'ID hướng dẫn sử dụng là bắt buộc'
          }),

        notes: Joi.string().allow('', null)
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Danh sách đơn thuốc phải là một mảng',
      'array.min': 'Danh sách đơn thuốc không được trống',
      'any.required': 'Danh sách đơn thuốc là bắt buộc'
    })
});

const prescriptionSchema = {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  bulkCreatePrescriptionSchema
};

module.exports = prescriptionSchema;
