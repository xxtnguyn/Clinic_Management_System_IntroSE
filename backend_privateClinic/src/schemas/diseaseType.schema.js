const Joi = require('joi');

// Schema cho tạo loại bệnh mới
const createDiseaseTypeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên loại bệnh không được để trống',
      'string.min': 'Tên loại bệnh không được để trống',
      'string.max': 'Tên loại bệnh không được quá 100 ký tự',
      'any.required': 'Tên loại bệnh là bắt buộc'
    }),
  
  description: Joi.string().allow('', null)
});

// Schema cho cập nhật loại bệnh
const updateDiseaseTypeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Tên loại bệnh không được để trống',
      'string.min': 'Tên loại bệnh không được để trống',
      'string.max': 'Tên loại bệnh không được quá 100 ký tự'
    }),
  
  description: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

const diseaseTypeSchema = {
  createDiseaseTypeSchema,
  updateDiseaseTypeSchema
};

module.exports = diseaseTypeSchema;
