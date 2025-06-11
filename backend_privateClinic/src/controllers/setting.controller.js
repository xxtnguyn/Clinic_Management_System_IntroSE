const Setting = require('../models/setting.model');
const { ValidationError } = require('../utils/apiError');
const db = require('../config/db');

/**
 * SettingController
 * Xử lý các request liên quan đến cài đặt hệ thống
 */
class SettingController {
  /**
   * Lấy danh sách cài đặt
   * @route GET /api/settings
   */
  static async getAllSettings(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const settings = await Setting.findAll({ search, page, limit });
      
      res.status(200).json({
        success: true,
        ...settings
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin cài đặt theo ID
   * @route GET /api/settings/:id
   */
  static async getSettingById(req, res, next) {
    try {
      const { id } = req.params;
      const setting = await Setting.findById(id);
      
      res.status(200).json({
        success: true,
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin cài đặt theo key
   * @route GET /api/settings/key/:key
   */
  static async getSettingByKey(req, res, next) {
    try {
      const { key } = req.params;
      const setting = await Setting.findByKey(key);
      
      res.status(200).json({
        success: true,
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy thông tin phòng khám (clinic settings)
   * @route GET /api/settings/clinic
   */
  static async getClinicInfo(req, res, next) {
    try {
      const clinicInfo = await Setting.getClinicInfo();
      
      res.status(200).json({
        success: true,
        data: clinicInfo
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tạo cài đặt mới
   * @route POST /api/settings
   */
  static async createSetting(req, res, next) {
    try {
      const setting = await Setting.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tạo cài đặt thành công',
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật cài đặt theo ID
   * @route PUT /api/settings/:id
   */
  static async updateSetting(req, res, next) {
    try {
      const { id } = req.params;
      const setting = await Setting.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật cài đặt thành công',
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật cài đặt theo key
   * @route PUT /api/settings/key/:key
   */
  static async updateSettingByKey(req, res, next) {
    try {
      const { key } = req.params;
      const setting = await Setting.updateByKey(key, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật cài đặt thành công',
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cập nhật nhiều cài đặt cùng lúc
   * @route PUT /api/settings/bulk
   */
  static async updateBulkSettings(req, res, next) {
    const client = await db.getClient();
    
    try {
      const { settings } = req.body;
      
      await client.query('BEGIN');
      
      const results = [];
      for (const item of settings) {
        const setting = await Setting.updateByKey(item.key, { value: item.value }, client);
        results.push(setting);
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật hàng loạt cài đặt thành công',
        data: results
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
  
  /**
   * Xóa cài đặt
   * @route DELETE /api/settings/:id
   */
  static async deleteSetting(req, res, next) {
    try {
      const { id } = req.params;
      await Setting.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa cài đặt thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingController;
