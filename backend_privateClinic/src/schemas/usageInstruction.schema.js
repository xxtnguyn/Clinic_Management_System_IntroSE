const Joi = require('joi');

// Schema cho tạo hướng dẫn sử dụng mới
const createUsageInstructionSchema = Joi.object({
  instruction: Joi.string()
    .required()
    .messages({
      'string.empty': 'Hướng dẫn sử dụng không được để trống',
      'any.required': 'Hướng dẫn sử dụng là bắt buộc'
    }),
  
  description: Joi.string().allow('', null)
});

// Schema cho cập nhật hướng dẫn sử dụng
const updateUsageInstructionSchema = Joi.object({
  instruction: Joi.string()
    .messages({
      'string.empty': 'Hướng dẫn sử dụng không được để trống'
    }),
  
  description: Joi.string().allow('', null)
}).min(1).messages({
  'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
});

const usageInstructionSchema = {
  createUsageInstructionSchema,
  updateUsageInstructionSchema
};

module.exports = usageInstructionSchema;
