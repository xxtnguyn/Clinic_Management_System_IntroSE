const Joi = require('joi');

/**
 * Schema cho chức năng đăng nhập
 */
const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'string.empty': 'Tên đăng nhập không được trống',
      'any.required': 'Tên đăng nhập là bắt buộc'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được trống',
      'any.required': 'Mật khẩu là bắt buộc'
    })
});

/**
 * Schema cho chức năng đổi mật khẩu
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu hiện tại không được trống',
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Mật khẩu mới không được trống',
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu mới là bắt buộc'
    })
});

const authSchema = {
  loginSchema,
  changePasswordSchema
};

module.exports = authSchema;
