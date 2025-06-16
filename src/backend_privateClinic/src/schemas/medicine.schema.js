const Joi = require('joi');

// Danh sách các đơn vị thuốc hợp lệ
const VALID_MEDICINE_UNITS = ['viên', 'chai'];

// Base schema cho thuốc
const baseMedicineSchema = {
  name: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên thuốc không được để trống',
      'string.max': 'Tên thuốc không được quá 100 ký tự',
      'any.required': 'Tên thuốc là bắt buộc'
    }),

  unit: Joi.string()
    .valid(...VALID_MEDICINE_UNITS)
    .required()
    .messages({
      'string.empty': 'Đơn vị tính không được để trống',
      'any.only': `Đơn vị tính phải là một trong các giá trị: ${VALID_MEDICINE_UNITS.join(', ')}`,
      'any.required': 'Đơn vị tính là bắt buộc'
    }),

  price: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Giá thuốc phải là số',
      'number.min': 'Giá thuốc không được nhỏ hơn 0',
      'number.precision': 'Giá thuốc chỉ được có tối đa 2 chữ số thập phân',
      'any.required': 'Giá thuốc là bắt buộc'
    }),

  quantity_in_stock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Số lượng trong kho phải là số',
      'number.integer': 'Số lượng trong kho phải là số nguyên',
      'number.min': 'Số lượng trong kho không được nhỏ hơn 0'
    }),

  description: Joi.string().allow('', null)
};

// Schema cho tạo thuốc mới
const createMedicineSchema = Joi.object({
  ...baseMedicineSchema
});

// Schema cho cập nhật thông tin thuốc
const updateMedicineSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .messages({
      'string.empty': 'Tên thuốc không được để trống',
      'string.max': 'Tên thuốc không được quá 100 ký tự'
    }),

  unit: Joi.string()
    .valid(...VALID_MEDICINE_UNITS)
    .messages({
      'string.empty': 'Đơn vị tính không được để trống',
      'any.only': `Đơn vị tính phải là một trong các giá trị: ${VALID_MEDICINE_UNITS.join(', ')}`
    }),

  price: Joi.number()
    .min(0)
    .precision(2)
    .messages({
      'number.base': 'Giá thuốc phải là số',
      'number.min': 'Giá thuốc không được nhỏ hơn 0',
      'number.precision': 'Giá thuốc chỉ được có tối đa 2 chữ số thập phân'
    }),

  quantity_in_stock: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Số lượng trong kho phải là số',
      'number.integer': 'Số lượng trong kho phải là số nguyên',
      'number.min': 'Số lượng trong kho không được nhỏ hơn 0'
    }),

  description: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

// Schema cho cập nhật tồn kho thuốc
const updateStockSchema = Joi.object({
  quantity_in_stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Số lượng trong kho phải là số',
      'number.integer': 'Số lượng trong kho phải là số nguyên',
      'number.min': 'Số lượng trong kho không được nhỏ hơn 0',
      'any.required': 'Số lượng trong kho là bắt buộc'
    })
});

const medicineSchema = {
  createMedicineSchema,
  updateMedicineSchema,
  updateStockSchema
};

module.exports = medicineSchema;
