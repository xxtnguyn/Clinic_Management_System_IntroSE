/**
 * Tập trung export tất cả các schema validation
 */

// Import tất cả các schema
const appointmentSchema = require('./appointment.schema');
const authSchema = require('./auth.schema');
const diseaseTypeSchema = require('./diseaseType.schema');
const invoiceSchema = require('./invoice.schema');
const medicalRecordSchema = require('./medicalRecord.schema');
const medicineSchema = require('./medicine.schema');
const patientSchema = require('./patient.schema');
const permissionSchema = require('./permission.schema');
const prescriptionSchema = require('./prescription.schema');
const roleSchema = require('./role.schema');
const settingSchema = require('./setting.schema');
const staffSchema = require('./staff.schema');
const usageInstructionSchema = require('./usageInstruction.schema');

// Export tất cả các schema
module.exports = {
  // Các schema chính
  appointmentSchema,
  authSchema,
  diseaseTypeSchema,
  invoiceSchema,
  medicalRecordSchema,
  medicineSchema,
  patientSchema,
  permissionSchema,
  prescriptionSchema,
  roleSchema,
  settingSchema,
  staffSchema,
  usageInstructionSchema,
  
  // Export các schema con thường dùng để dễ truy cập
  ...authSchema, // loginSchema, changePasswordSchema
  ...patientSchema, // createPatientSchema, updatePatientSchema
  ...settingSchema, // createSettingSchema, updateSettingSchema, bulkUpdateSettingSchema
};

// Export mặc định là một object chứa tất cả các schema
module.exports.default = module.exports;
