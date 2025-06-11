/**
 * Schema validation cho Settings API
 */
const Joi = require('joi');

/**
 * Schema validation cho Settings API
 * Bảng settings trong SQL:
 * - id: SERIAL PRIMARY KEY
 * - key: VARCHAR(50) NOT NULL UNIQUE
 * - value: TEXT NOT NULL
 * - description: TEXT
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */

// Base schema cho setting
const settingKeySchema = Joi.string()
  .required()
  .max(50)
  .pattern(/^[a-z_]+$/)
  .messages({
    'string.empty': 'Key cài đặt không được để trống',
    'string.max': 'Key cài đặt không được quá 50 ký tự',
    'string.pattern.base': 'Key cài đặt chỉ được chứa chữ cái thường và dấu gạch dưới',
    'any.required': 'Key cài đặt là bắt buộc'
  });

const settingValueSchema = Joi.string()
  .required()
  .messages({
    'string.empty': 'Giá trị cài đặt không được để trống',
    'any.required': 'Giá trị cài đặt là bắt buộc'
  });

const settingDescriptionSchema = Joi.string()
  .allow('', null)
  .max(255)
  .messages({
    'string.max': 'Mô tả không được quá 255 ký tự'
  });

// Schema cho tạo cài đặt mới
const createSettingSchema = Joi.object({
  key: settingKeySchema,
  value: settingValueSchema,
  description: settingDescriptionSchema
});

// Schema cho cập nhật cài đặt
const updateSettingSchema = Joi.object({
  value: settingValueSchema,
  description: settingDescriptionSchema
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho cập nhật hàng loạt
const settingItemSchema = Joi.object({
  key: settingKeySchema,
  value: settingValueSchema
});

const bulkUpdateSettingSchema = Joi.object({
  settings: Joi.array()
    .items(settingItemSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'Danh sách cài đặt phải là một mảng',
      'array.min': 'Danh sách cài đặt không được trống',
      'any.required': 'Danh sách cài đặt là bắt buộc'
    })
});

const settingSchema = {
  createSettingSchema,
  updateSettingSchema,
  bulkUpdateSettingSchema
};

module.exports = settingSchema;
