const express = require('express');
const { param } = require('express-validator');
const InvoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validation.middleware');
const { invoiceSchema } = require('../schemas');
const { 
  createInvoiceSchema, 
  updateInvoiceSchema, 
  processPaymentSchema 
} = invoiceSchema;

const router = express.Router();

// Validation cho các tham số ngày tháng
const dateParamValidation = [
  param('date')
    .isDate().withMessage('Ngày phải đúng định dạng YYYY-MM-DD')
];

const monthYearParamValidation = [
  param('month')
    .isInt({ min: 1, max: 12 }).withMessage('Tháng phải từ 1-12'),
  
  param('year')
    .isInt({ min: 2000 }).withMessage('Năm không hợp lệ')
];

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

// Route: GET /api/invoices
// Mô tả: Lấy danh sách tất cả hóa đơn
// Quyền: view_invoices
router.get(
  '/',
  authorize(['view_invoices']),
  InvoiceController.getAllInvoices
);

// Route: GET /api/invoices/daily-revenue/:date
// Mô tả: Lấy báo cáo doanh thu theo ngày
// Quyền: view_reports
router.get(
  '/daily-revenue/:date',
  authorize(['view_reports']),
  dateParamValidation,
  InvoiceController.getDailyRevenue
);

// Route: GET /api/invoices/monthly-revenue/:year/:month
// Mô tả: Lấy báo cáo doanh thu theo tháng
// Quyền: view_reports
router.get(
  '/monthly-revenue/:year/:month',
  authorize(['view_reports']),
  monthYearParamValidation,
  InvoiceController.getMonthlyRevenue
);

// Route: GET /api/invoices/:id
// Mô tả: Lấy thông tin của một hóa đơn
// Quyền: view_invoices
router.get(
  '/:id',
  authorize(['view_invoices']),
  InvoiceController.getInvoiceById
);

// Route: POST /api/invoices
// Mô tả: Tạo hóa đơn mới
// Quyền: create_invoice
router.post(
  '/',
  authorize(['create_invoice']),
  validate(createInvoiceSchema),
  InvoiceController.createInvoice
);

// Route: PUT /api/invoices/:id
// Mô tả: Cập nhật thông tin hóa đơn
// Quyền: update_invoice
router.put(
  '/:id',
  authorize(['update_invoice']),
  validate(updateInvoiceSchema),
  InvoiceController.updateInvoice
);

// Route: PATCH /api/invoices/:id/process-payment
// Mô tả: Thanh toán hóa đơn
// Quyền: process_payment
router.patch(
  '/:id/process-payment',
  authorize(['process_payment']),
  validate(processPaymentSchema),
  InvoiceController.processPayment
);

// Route: PATCH /api/invoices/:id/cancel
// Mô tả: Hủy hóa đơn
// Quyền: update_invoice
router.patch(
  '/:id/cancel',
  authorize(['update_invoice']),
  InvoiceController.cancelInvoice
);

module.exports = router;
