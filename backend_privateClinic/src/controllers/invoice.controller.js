const Invoice = require('../models/invoice.model');
const { ValidationError } = require('../utils/apiError');

/**
 * InvoiceController
 * Xử lý các request liên quan đến hóa đơn
 */
class InvoiceController {
  /**
   * Lấy danh sách hóa đơn
   * @route GET /api/invoices
   */
  static async getAllInvoices(req, res, next) {
    try {
      const { 
        medicalRecordId, patientId, staffId, 
        status, startDate, endDate, page, limit 
      } = req.query;
      
      const invoices = await Invoice.findAll({ 
        medicalRecordId, patientId, staffId, 
        status, startDate, endDate, page, limit 
      });
      
      res.status(200).json({
        success: true,
        ...invoices
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin hóa đơn theo ID
   * @route GET /api/invoices/:id
   */
  static async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findById(id);
      
      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo hóa đơn mới
   * @route POST /api/invoices
   */
  static async createInvoice(req, res, next) {
    try {
      // Thêm staff_id từ người dùng hiện tại
      const data = {
        ...req.body,
        staff_id: req.user.id
      };
      
      const invoice = await Invoice.create(data);
      
      res.status(201).json({
        success: true,
        message: 'Tạo hóa đơn thành công',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật hóa đơn
   * @route PUT /api/invoices/:id
   */
  static async updateInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật hóa đơn thành công',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Thanh toán hóa đơn
   * @route PATCH /api/invoices/:id/process-payment
   */
  static async processPayment(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.processPayment(id);
      
      res.status(200).json({
        success: true,
        message: 'Thanh toán hóa đơn thành công',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Hủy hóa đơn
   * @route PATCH /api/invoices/:id/cancel
   */
  static async cancelInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.cancelInvoice(id);
      
      res.status(200).json({
        success: true,
        message: 'Hủy hóa đơn thành công',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy báo cáo doanh thu theo ngày
   * @route GET /api/invoices/daily-revenue/:date
   */
  static async getDailyRevenue(req, res, next) {
    try {
      const { date } = req.params;
      const revenue = await Invoice.getDailyRevenue(date);
      
      res.status(200).json({
        success: true,
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy báo cáo doanh thu theo tháng
   * @route GET /api/invoices/monthly-revenue/:year/:month
   */
  static async getMonthlyRevenue(req, res, next) {
    try {
      const { year, month } = req.params;
      const revenue = await Invoice.getMonthlyRevenue(parseInt(month), parseInt(year));
      
      res.status(200).json({
        success: true,
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvoiceController;
