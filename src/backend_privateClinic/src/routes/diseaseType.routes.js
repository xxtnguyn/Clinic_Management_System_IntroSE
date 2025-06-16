const express = require('express');
const DiseaseTypeController = require('../controllers/diseaseType.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { diseaseTypeSchema } = require('../schemas');
const { createDiseaseTypeSchema, updateDiseaseTypeSchema } = diseaseTypeSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/disease-types
// Mô tả: Lấy danh sách tất cả loại bệnh
// Quyền: view_disease_types
router.get(
  '/',
  authorize(['view_disease_types']),
  DiseaseTypeController.getAllDiseaseTypes
);

// Route: GET /api/disease-types/limits
// Mô tả: Lấy giới hạn số lượng loại bệnh
// Quyền: view_disease_types
router.get(
  '/limits',
  authorize(['view_disease_types']),
  DiseaseTypeController.getDiseaseTypeLimits
);

// Route: GET /api/disease-types/:id
// Mô tả: Lấy thông tin của một loại bệnh
// Quyền: view_disease_types
router.get(
  '/:id',
  authorize(['view_disease_types']),
  DiseaseTypeController.getDiseaseTypeById
);

// Route: POST /api/disease-types
// Mô tả: Tạo loại bệnh mới
// Quyền: create_disease_type
router.post(
  '/',
  authorize(['create_disease_type']),
  validate(createDiseaseTypeSchema),
  DiseaseTypeController.createDiseaseType
);

// Route: PUT /api/disease-types/:id
// Mô tả: Cập nhật thông tin loại bệnh
// Quyền: update_disease_type
router.put(
  '/:id',
  authorize(['update_disease_type']),
  validate(updateDiseaseTypeSchema),
  DiseaseTypeController.updateDiseaseType
);

// Route: DELETE /api/disease-types/:id
// Mô tả: Xóa loại bệnh
// Quyền: delete_disease_type
router.delete(
  '/:id',
  authorize(['delete_disease_type']),
  DiseaseTypeController.deleteDiseaseType
);

module.exports = router;
