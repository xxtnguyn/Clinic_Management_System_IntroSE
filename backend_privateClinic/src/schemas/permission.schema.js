const Joi = require('joi');

// Schema cho tạo quyền mới
const createPermissionSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .pattern(/^[a-z_]+$/)
    .required()
    .messages({
      'string.empty': 'Tên quyền không được để trống',
      'string.max': 'Tên quyền không được quá 50 ký tự',
      'string.pattern.base': 'Tên quyền chỉ được chứa chữ cái thường và dấu gạch dưới',
      'any.required': 'Tên quyền là bắt buộc'
    }),
  
  description: Joi.string().allow('', null)
});

// Schema cho cập nhật quyền
const updatePermissionSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .pattern(/^[a-z_]+$/)
    .messages({
      'string.empty': 'Tên quyền không được để trống',
      'string.max': 'Tên quyền không được quá 50 ký tự',
      'string.pattern.base': 'Tên quyền chỉ được chứa chữ cái thường và dấu gạch dưới'
    }),
  
  description: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

module.exports = {
  createPermissionSchema,
  updatePermissionSchema
};
