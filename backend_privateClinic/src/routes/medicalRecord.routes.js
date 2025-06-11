const express = require('express');
const MedicalRecordController = require('../controllers/medicalRecord.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { medicalRecordSchema } = require('../schemas');
const { createMedicalRecordSchema, updateMedicalRecordSchema } = medicalRecordSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/medical-records
// Mô tả: Lấy danh sách tất cả hồ sơ bệnh án
// Quyền: view_medical_records
router.get(
  '/',
  authorize(['view_medical_records']),
  MedicalRecordController.getAllMedicalRecords
);

// Route: GET /api/medical-records/:id
// Mô tả: Lấy thông tin của một hồ sơ bệnh án
// Quyền: view_medical_records
router.get(
  '/:id',
  authorize(['view_medical_records']),
  MedicalRecordController.getMedicalRecordById
);

// Route: POST /api/medical-records
// Mô tả: Tạo hồ sơ bệnh án mới
// Quyền: create_medical_record
router.post(
  '/',
  authorize(['create_medical_record']),
  validate(createMedicalRecordSchema),
  MedicalRecordController.createMedicalRecord
);

// Route: PUT /api/medical-records/:id
// Mô tả: Cập nhật thông tin hồ sơ bệnh án
// Quyền: update_medical_record
router.put(
  '/:id',
  authorize(['update_medical_record']),
  validate(updateMedicalRecordSchema),
  MedicalRecordController.updateMedicalRecord
);

// Route: DELETE /api/medical-records/:id
// Mô tả: Xóa hồ sơ bệnh án
// Quyền: delete_medical_record
router.delete(
  '/:id',
  authorize(['delete_medical_record']),
  MedicalRecordController.deleteMedicalRecord
);

// Route: GET /api/medical-records/:id/prescriptions
// Mô tả: Lấy danh sách đơn thuốc của hồ sơ bệnh án
// Quyền: view_medical_records, view_prescriptions
router.get(
  '/:id/prescriptions',
  authorize(['view_medical_records', 'view_prescriptions']),
  MedicalRecordController.getMedicalRecordPrescriptions
);

// Route: GET /api/medical-records/:id/invoice
// Mô tả: Lấy thông tin hóa đơn của hồ sơ bệnh án
// Quyền: view_medical_records, view_invoices
router.get(
  '/:id/invoice',
  authorize(['view_medical_records', 'view_invoices']),
  MedicalRecordController.getMedicalRecordInvoice
);

module.exports = router;
