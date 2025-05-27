const { BadRequestError } = require('../utils/apiError');

/**
 * Middleware xác thực dữ liệu đầu vào sử dụng Joi schema
 * @param {Joi.Schema} schema - Schema Joi dùng để validate
 * @param {string} [source='body'] - Nguồn dữ liệu cần validate (body, query, params)
 * @returns {Function} Middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      allowUnknown: false, // Không cho phép các trường không được định nghĩa trong schema
      stripUnknown: true, // Loại bỏ các trường không được định nghĩa
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(new BadRequestError(`Validation error: ${message}`));
    }

    // Thay thế dữ liệu đã được validate và làm sạch
    req[source] = value;
    next();
  };
};

module.exports = validate;
