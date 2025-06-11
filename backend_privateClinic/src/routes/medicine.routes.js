const express = require('express');
const MedicineController = require('../controllers/medicine.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { medicineSchema } = require('../schemas');
const { createMedicineSchema, updateMedicineSchema, updateStockSchema } = medicineSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/medicines
// Mô tả: Lấy danh sách tất cả thuốc
// Quyền: view_medicines
router.get(
  '/',
  authorize(['view_medicines']),
  MedicineController.getAllMedicines
);

// Route: GET /api/medicines/statistics
// Mô tả: Lấy thống kê sử dụng thuốc
// Quyền: view_medicines
router.get(
  '/statistics',
  authorize(['view_medicines']),
  MedicineController.getMedicineStatistics
);

// Route: GET /api/medicines/limits
// Mô tả: Lấy giới hạn số lượng thuốc
// Quyền: view_medicines
router.get(
  '/limits',
  authorize(['view_medicines']),
  MedicineController.getMedicineLimits
);

// Route: GET /api/medicines/:id
// Mô tả: Lấy thông tin của một thuốc
// Quyền: view_medicines
router.get(
  '/:id',
  authorize(['view_medicines']),
  MedicineController.getMedicineById
);

// Route: POST /api/medicines
// Mô tả: Tạo thuốc mới
// Quyền: create_medicine
router.post(
  '/',
  authorize(['create_medicine']),
  validate(createMedicineSchema),
  MedicineController.createMedicine
);

// Route: PUT /api/medicines/:id
// Mô tả: Cập nhật thông tin thuốc
// Quyền: update_medicine
router.put(
  '/:id',
  authorize(['update_medicine']),
  validate(updateMedicineSchema),
  MedicineController.updateMedicine
);

// Route: PATCH /api/medicines/:id/stock
// Mô tả: Cập nhật số lượng thuốc trong kho
// Quyền: manage_medicine_stock
router.patch(
  '/:id/stock',
  authorize(['manage_medicine_stock']),
  validate(updateStockSchema),
  MedicineController.updateStock
);

// Route: DELETE /api/medicines/:id
// Mô tả: Xóa thuốc
// Quyền: delete_medicine
router.delete(
  '/:id',
  authorize(['delete_medicine']),
  MedicineController.deleteMedicine
);

module.exports = router;
