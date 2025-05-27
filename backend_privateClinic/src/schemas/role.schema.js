const Joi = require('joi');

// Danh sách các vai trò hợp lệ
const VALID_ROLE_NAMES = ['admin', 'doctor', 'receptionist'];

// Schema cho tạo vai trò mới
const createRoleSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .valid(...VALID_ROLE_NAMES)
    .required()
    .messages({
      'string.empty': 'Tên vai trò không được để trống',
      'string.max': 'Tên vai trò không được quá 50 ký tự',
      'any.only': `Tên vai trò phải là một trong các giá trị: ${VALID_ROLE_NAMES.join(', ')}`,
      'any.required': 'Tên vai trò là bắt buộc'
    }),

  description: Joi.string().allow('', null),

  permissionIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .messages({
      'array.base': 'Danh sách ID quyền phải là một mảng',
      'number.base': 'Mỗi ID quyền phải là số',
      'number.integer': 'Mỗi ID quyền phải là số nguyên',
      'number.min': 'Mỗi ID quyền phải lớn hơn 0'
    })
});

// Schema cho cập nhật vai trò
const updateRoleSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .valid(...VALID_ROLE_NAMES)
    .messages({
      'string.empty': 'Tên vai trò không được để trống',
      'string.max': 'Tên vai trò không được quá 50 ký tự',
      'any.only': `Tên vai trò phải là một trong các giá trị: ${VALID_ROLE_NAMES.join(', ')}`
    }),

  description: Joi.string().allow('', null),

  permissionIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .messages({
      'array.base': 'Danh sách ID quyền phải là một mảng',
      'number.base': 'Mỗi ID quyền phải là số',
      'number.integer': 'Mỗi ID quyền phải là số nguyên',
      'number.min': 'Mỗi ID quyền phải lớn hơn 0'
    })
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho cập nhật quyền của vai trò
const updateRolePermissionsSchema = Joi.object({
  permissionIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .required()
    .messages({
      'array.base': 'Danh sách ID quyền phải là một mảng',
      'array.includesRequiredUnknowns': 'Danh sách ID quyền không được để trống',
      'any.required': 'Danh sách ID quyền là bắt buộc',
      'number.base': 'Mỗi ID quyền phải là số',
      'number.integer': 'Mỗi ID quyền phải là số nguyên',
      'number.min': 'Mỗi ID quyền phải lớn hơn 0'
    })
});

const roleSchema = {
  createRoleSchema,
  updateRoleSchema,
  updateRolePermissionsSchema
};

module.exports = roleSchema;
