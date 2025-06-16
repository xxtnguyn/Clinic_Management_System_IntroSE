const express = require('express');
const RoleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { roleSchema } = require('../schemas');
const { createRoleSchema, updateRoleSchema } = roleSchema;

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/roles
// Mô tả: Lấy danh sách tất cả vai trò
// Quyền: view_roles
router.get(
  '/',
  authorize(['view_roles']),
  RoleController.getAllRoles
);

// Route: GET /api/roles/all
// Mô tả: Lấy danh sách tất cả vai trò không phân trang
// Quyền: view_roles
router.get(
  '/all',
  authorize(['view_roles']),
  RoleController.getListAll
);

// Route: GET /api/roles/:id
// Mô tả: Lấy thông tin của một vai trò
// Quyền: view_roles
router.get(
  '/:id',
  authorize(['view_roles']),
  RoleController.getRoleById
);

// Route: GET /api/roles/:id/permissions
// Mô tả: Lấy thông tin vai trò kèm quyền hạn
// Quyền: view_roles
router.get(
  '/:id/permissions',
  authorize(['view_roles']),
  RoleController.getRoleWithPermissions
);

// Route: POST /api/roles
// Mô tả: Tạo vai trò mới
// Quyền: create_role
router.post(
  '/',
  authorize(['create_role']),
  validate(createRoleSchema),
  RoleController.createRole
);

// Route: PUT /api/roles/:id
// Mô tả: Cập nhật thông tin vai trò
// Quyền: update_role
router.put(
  '/:id',
  authorize(['update_role']),
  validate(updateRoleSchema),
  RoleController.updateRole
);

// Route: DELETE /api/roles/:id
// Mô tả: Xóa vai trò
// Quyền: delete_role
router.delete(
  '/:id',
  authorize(['delete_role']),
  RoleController.deleteRole
);

// Route: POST /api/roles/:id/permissions
// Mô tả: Thêm quyền cho vai trò
// Quyền: update_role
router.post(
  '/:id/permissions',
  authorize(['update_role']),
  RoleController.addPermission
);

// Route: DELETE /api/roles/:id/permissions/:permissionId
// Mô tả: Xóa quyền khỏi vai trò
// Quyền: update_role
router.delete(
  '/:id/permissions/:permissionId',
  authorize(['update_role']),
  RoleController.removePermission
);

module.exports = router;
