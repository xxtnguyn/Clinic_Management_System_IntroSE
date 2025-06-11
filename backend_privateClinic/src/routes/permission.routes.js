const express = require('express');
const PermissionController = require('../controllers/permission.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { permissionSchema } = require('../schemas');
const { createPermissionSchema, updatePermissionSchema } = permissionSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/permissions
// Mô tả: Lấy danh sách tất cả quyền hạn
// Quyền: view_permissions
router.get(
  '/',
  authorize(['view_permissions']),
  PermissionController.getAllPermissions
);

// Route: GET /api/permissions/all
// Mô tả: Lấy danh sách tất cả quyền hạn không phân trang
// Quyền: view_permissions
router.get(
  '/all',
  authorize(['view_permissions']),
  PermissionController.getListAll
);

// Route: GET /api/permissions/:id
// Mô tả: Lấy thông tin của một quyền hạn
// Quyền: view_permissions
router.get(
  '/:id',
  authorize(['view_permissions']),
  PermissionController.getPermissionById
);

// Route: GET /api/permissions/:id/roles
// Mô tả: Lấy danh sách vai trò có quyền hạn cụ thể
// Quyền: view_permissions
router.get(
  '/:id/roles',
  authorize(['view_permissions']),
  PermissionController.getRolesWithPermission
);

// Route: POST /api/permissions
// Mô tả: Tạo quyền hạn mới
// Quyền: create_permission
router.post(
  '/',
  authorize(['create_permission']),
  validate(createPermissionSchema),
  PermissionController.createPermission
);

// Route: PUT /api/permissions/:id
// Mô tả: Cập nhật thông tin quyền hạn
// Quyền: update_permission
router.put(
  '/:id',
  authorize(['update_permission']),
  validate(updatePermissionSchema),
  PermissionController.updatePermission
);

// Route: DELETE /api/permissions/:id
// Mô tả: Xóa quyền hạn
// Quyền: delete_permission
router.delete(
  '/:id',
  authorize(['delete_permission']),
  PermissionController.deletePermission
);

module.exports = router;
