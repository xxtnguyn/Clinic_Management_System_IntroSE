const Joi = require('joi');

// Schema cho tạo nhân viên mới
const createStaffSchema = Joi.object({
  // Hỗ trợ cả role_id và roleId, ít nhất một trong hai phải được cung cấp
  role_id: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'ID vai trò phải là số',
      'number.integer': 'ID vai trò phải là số nguyên',
      'number.min': 'ID vai trò phải lớn hơn 0'
    }),
    
  roleId: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'ID vai trò phải là số',
      'number.integer': 'ID vai trò phải là số nguyên',
      'number.min': 'ID vai trò phải lớn hơn 0'
    })
    .when('role_id', {
      is: Joi.exist(),
      then: Joi.forbidden().messages({
        'any.unknown': 'Chỉ được cung cấp role_id hoặc roleId, không được cung cấp cả hai'
      })
    }),
    
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.empty': 'Tên đăng nhập không được để trống',
      'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
      'string.max': 'Tên đăng nhập không được quá 50 ký tự',
      'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
      'any.required': 'Tên đăng nhập là bắt buộc'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu là bắt buộc'
    }),

  confirm_password: Joi.any()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu',
      'any.required': 'Xác nhận mật khẩu là bắt buộc'
    }),

  full_name: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    }),

  email: Joi.string()
    .email()
    .allow('', null)
    .messages({
      'string.email': 'Email không hợp lệ'
    }),

  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx)'
    }),

  address: Joi.string().allow('', null),
  
  gender: Joi.string()
    .valid('Nam', 'Nữ', 'Khác')
    .required()
    .messages({
      'string.empty': 'Giới tính không được để trống',
      'any.only': 'Giới tính phải là Nam, Nữ hoặc Khác',
      'any.required': 'Giới tính là bắt buộc'
    }),
    
  birth_date: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.base': 'Ngày sinh không hợp lệ',
      'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại',
      'any.required': 'Ngày sinh là bắt buộc'
    }),
    
  avatar: Joi.string()
    .default('default-avatar.png')
    .messages({
      'string.uri': 'Đường dẫn avatar không hợp lệ'
    }),

  is_active: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Trạng thái hoạt động phải là true/false'
    })
}).with('password', 'confirm_password');

// Schema cho cập nhật thông tin nhân viên
const updateStaffSchema = Joi.object({
  full_name: Joi.string()
    .max(100)
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.max': 'Họ tên không được quá 100 ký tự'
    }),

  email: Joi.string()
    .email()
    .allow('', null)
    .messages({
      'string.email': 'Email không hợp lệ'
    }),

  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx)'
    }),

  address: Joi.string().allow('', null),
  
  gender: Joi.string()
    .valid('Nam', 'Nữ', 'Khác')
    .messages({
      'string.empty': 'Giới tính không được để trống',
      'any.only': 'Giới tính phải là Nam, Nữ hoặc Khác'
    }),
    
  birth_date: Joi.date()
    .max('now')
    .messages({
      'date.base': 'Ngày sinh không hợp lệ',
      'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại'
    }),
    
  avatar: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Đường dẫn avatar không hợp lệ'
    }),

  role_id: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'ID vai trò phải là số',
      'number.integer': 'ID vai trò phải là số nguyên',
      'number.min': 'ID vai trò phải lớn hơn 0'
    }),

  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'Trạng thái hoạt động phải là true/false'
    })
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho đổi mật khẩu
const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu hiện tại không được để trống',
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),

  new_password: Joi.string()
    .min(6)
    .required()
    .invalid(Joi.ref('current_password'))
    .messages({
      'string.empty': 'Mật khẩu mới không được để trống',
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.invalid': 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      'any.required': 'Mật khẩu mới là bắt buộc'
    }),

  confirm_password: Joi.any()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
      'any.required': 'Xác nhận mật khẩu là bắt buộc'
    })
}).with('new_password', 'confirm_password');

// Schema cho upload avatar
const uploadAvatarSchema = Joi.object({
  avatar: Joi.any()
    .required()
    .messages({
      'any.required': 'Vui lòng chọn ảnh đại diện'
    })
});

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  changePasswordSchema,
  uploadAvatarSchema
};
