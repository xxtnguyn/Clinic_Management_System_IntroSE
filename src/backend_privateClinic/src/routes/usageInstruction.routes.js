const express = require('express');
const UsageInstructionController = require('../controllers/usageInstruction.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { usageInstructionSchema } = require('../schemas');
const { 
  createUsageInstructionSchema, 
  updateUsageInstructionSchema 
} = usageInstructionSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/usage-instructions
// Mô tả: Lấy danh sách tất cả cách dùng thuốc
// Quyền: view_usage_instructions
router.get(
  '/',
  authorize(['view_usage_instructions']),
  UsageInstructionController.getAllUsageInstructions
);

// Route: GET /api/usage-instructions/limits
// Mô tả: Lấy giới hạn số lượng cách dùng thuốc
// Quyền: view_usage_instructions
router.get(
  '/limits',
  authorize(['view_usage_instructions']),
  UsageInstructionController.getUsageInstructionLimits
);

// Route: GET /api/usage-instructions/:id
// Mô tả: Lấy thông tin của một cách dùng thuốc
// Quyền: view_usage_instructions
router.get(
  '/:id',
  authorize(['view_usage_instructions']),
  UsageInstructionController.getUsageInstructionById
);

// Route: POST /api/usage-instructions
// Mô tả: Tạo cách dùng thuốc mới
// Quyền: create_usage_instruction
router.post(
  '/',
  authorize(['create_usage_instruction']),
  validate(createUsageInstructionSchema),
  UsageInstructionController.createUsageInstruction
);

// Route: PUT /api/usage-instructions/:id
// Mô tả: Cập nhật thông tin cách dùng thuốc
// Quyền: update_usage_instruction
router.put(
  '/:id',
  authorize(['update_usage_instruction']),
  validate(updateUsageInstructionSchema),
  UsageInstructionController.updateUsageInstruction
);

// Route: DELETE /api/usage-instructions/:id
// Mô tả: Xóa cách dùng thuốc
// Quyền: delete_usage_instruction
router.delete(
  '/:id',
  authorize(['delete_usage_instruction']),
  UsageInstructionController.deleteUsageInstruction
);

module.exports = router;
