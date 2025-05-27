const express = require('express');
const StaffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');

// Import các schema cần thiết
const { 
  createStaffSchema, 
  updateStaffSchema, 
  changePasswordSchema,
  loginSchema
} = require('../schemas/staff.schema');

const router = express.Router();

// Route đăng nhập không yêu cầu xác thực
router.post(
  '/login',
  validate(loginSchema),
  StaffController.login
);

// Tất cả các route dưới đây đều yêu cầu xác thực
router.use(authenticate);


// Route: GET /api/staff
// Mô tả: Lấy danh sách tất cả nhân viên
// Quyền: view_staff
router.get(
  '/',
  authorize(['view_staff']),
  StaffController.getAllStaff
);

// Route: GET /api/staff/:id
// Mô tả: Lấy thông tin của một nhân viên
// Quyền: view_staff
router.get(
  '/:id',
  authorize(['view_staff']),
  StaffController.getStaffById
);

// Route: POST /api/staff
// Mô tả: Tạo nhân viên mới
// Quyền: create_staff
router.post(
  '/',
  authorize(['create_staff']),
  validate(createStaffSchema),
  StaffController.createStaff
);

// Route: PUT /api/staff/:id
// Mô tả: Cập nhật thông tin nhân viên
// Quyền: update_staff hoặc chính nhân viên đó
router.put(
  '/:id',
  validate(updateStaffSchema),
  (req, res, next) => {
    // Cho phép admin hoặc chính nhân viên đó cập nhật thông tin
    if (req.user.roleId === 1 || req.user.id === parseInt(req.params.id)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này'
      });
    }
  },
  StaffController.updateStaff
);

// Route: POST /api/staff/change-password
// Mô tả: Đổi mật khẩu nhân viên
// Quyền: Chỉ chính nhân viên đó mới được đổi mật khẩu của mình
router.post(
  '/change-password',
  validate(changePasswordSchema),
  StaffController.changePassword
);


// Route: DELETE /api/staff/:id
// Mô tả: Xóa nhân viên
// Quyền: delete_staff (chỉ admin)
router.delete(
  '/:id',
  authorize(['delete_staff']),
  StaffController.deleteStaff
);

module.exports = router;
