const express = require('express');
const PrescriptionController = require('../controllers/prescription.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { prescriptionSchema } = require('../schemas');
const { createPrescriptionSchema, updatePrescriptionSchema } = prescriptionSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/prescriptions
// Mô tả: Lấy danh sách tất cả đơn thuốc
// Quyền: view_prescriptions
router.get(
  '/',
  authorize(['view_prescriptions']),
  PrescriptionController.getAllPrescriptions
);

// Route: GET /api/prescriptions/calculate-fee/:medicalRecordId
// Mô tả: Tính tổng tiền thuốc cho một hồ sơ bệnh án
// Quyền: view_prescriptions
router.get(
  '/calculate-fee/:medicalRecordId',
  authorize(['view_prescriptions']),
  PrescriptionController.calculateMedicineFee
);

// Route: GET /api/prescriptions/:id
// Mô tả: Lấy thông tin của một đơn thuốc
// Quyền: view_prescriptions
router.get(
  '/:id',
  authorize(['view_prescriptions']),
  PrescriptionController.getPrescriptionById
);

// Route: POST /api/prescriptions
// Mô tả: Tạo đơn thuốc mới
// Quyền: create_prescription
router.post(
  '/',
  authorize(['create_prescription']),
  validate(createPrescriptionSchema),
  PrescriptionController.createPrescription
);

// Route: PUT /api/prescriptions/:id
// Mô tả: Cập nhật thông tin đơn thuốc
// Quyền: update_prescription
router.put(
  '/:id',
  authorize(['update_prescription']),
  validate(updatePrescriptionSchema),
  PrescriptionController.updatePrescription
);

// Route: DELETE /api/prescriptions/:id
// Mô tả: Xóa đơn thuốc
// Quyền: delete_prescription
router.delete(
  '/:id',
  authorize(['delete_prescription']),
  PrescriptionController.deletePrescription
);

module.exports = router;
