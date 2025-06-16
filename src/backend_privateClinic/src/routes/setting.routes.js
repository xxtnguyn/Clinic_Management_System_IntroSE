const express = require('express');
const SettingController = require('../controllers/setting.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { settingSchema } = require('../schemas');
const { 
  createSettingSchema, 
  updateSettingSchema, 
  bulkUpdateSettingSchema 
} = settingSchema;
const validate = require('../middlewares/validation.middleware');

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/settings
// Mô tả: Lấy danh sách tất cả cài đặt
// Quyền: view_settings
router.get(
  '/',
  authorize(['view_settings']),
  SettingController.getAllSettings
);

// Route: GET /api/settings/clinic
// Mô tả: Lấy thông tin phòng khám từ cài đặt
// Quyền: view_settings
router.get(
  '/clinic',
  authorize(['view_settings']),
  SettingController.getClinicInfo
);

// Route: GET /api/settings/:id
// Mô tả: Lấy thông tin của một cài đặt theo ID
// Quyền: view_settings
router.get(
  '/:id',
  authorize(['view_settings']),
  SettingController.getSettingById
);

// Route: GET /api/settings/key/:key
// Mô tả: Lấy thông tin của một cài đặt theo key
// Quyền: view_settings
router.get(
  '/key/:key',
  authorize(['view_settings']),
  SettingController.getSettingByKey
);

// Route: POST /api/settings
// Mô tả: Tạo cài đặt mới
// Quyền: create_setting
router.post(
  '/',
  authorize(['create_setting']),
  validate(createSettingSchema),
  SettingController.createSetting
);

// Route: PUT /api/settings/:id
// Mô tả: Cập nhật thông tin cài đặt theo ID
// Quyền: update_setting
router.put(
  '/:id',
  authorize(['update_setting']),
  validate(updateSettingSchema),
  SettingController.updateSetting
);

// Route: PUT /api/settings/key/:key
// Mô tả: Cập nhật thông tin cài đặt theo key
// Quyền: update_setting
router.put(
  '/key/:key',
  authorize(['update_setting']),
  validate(updateSettingSchema),
  SettingController.updateSettingByKey
);

// Route: PUT /api/settings/bulk
// Mô tả: Cập nhật nhiều cài đặt cùng lúc
// Quyền: update_setting
router.put(
  '/bulk',
  authorize(['update_setting']),
  validate(bulkUpdateSettingSchema),
  SettingController.updateBulkSettings
);

// Route: DELETE /api/settings/:id
// Mô tả: Xóa cài đặt
// Quyền: delete_setting
router.delete(
  '/:id',
  authorize(['delete_setting']),
  SettingController.deleteSetting
);

module.exports = router;
