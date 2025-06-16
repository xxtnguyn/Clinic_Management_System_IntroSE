const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const medicineRoutes = require('./routes/medicine.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const settingRoutes = require('./routes/setting.routes');
const staffRoutes = require('./routes/staff.routes');
const roleRoutes = require('./routes/role.routes');
const diseaseTypeRoutes = require('./routes/diseaseType.routes');
const usageInstructionRoutes = require('./routes/usageInstruction.routes');

// Import middlewares
const { errorHandler } = require('./middlewares/errorHandler');

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/disease-types', diseaseTypeRoutes);
app.use('/api/usage-instructions', usageInstructionRoutes);

// Error handling
app.use(errorHandler);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
