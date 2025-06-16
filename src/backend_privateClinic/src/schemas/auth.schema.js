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

/**
 * Schema cho chức năng quên mật khẩu
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    })
});

/**
 * Schema cho chức năng đặt lại mật khẩu
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token không được để trống',
      'any.required': 'Token là bắt buộc'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    })
});

const authSchema = {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};

module.exports = authSchema;
