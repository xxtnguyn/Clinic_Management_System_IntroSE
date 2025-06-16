import axiosInstance from './axios';

export interface Patient {
  id: number;
  full_name: string; 
  gender: string;
  birth_year: number;
  phone: string;
  address: string;
}

export interface PatientExaminationHistory {
  id: number;
  "Họ Tên": string;
  "Ngày Khám": string;
  "Loại Bệnh": string;
  "Triệu Chứng": string;
}

class PatientService {
  async getPatientsExaminationHistory(name = '', date = '') {
    try {
      console.log('Fetching patient examination history with name:', name, 'and date:', date);
      const response = await axiosInstance.get('/patients/view_patient_examination_history', {
        params: { name, date }
      });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch examination history'
      };
    }
  }

  async getAllPatients() {
    try {
      console.log('Fetching all patients...');
      const response = await axiosInstance.get('/patients');
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch patients'
      };
    }
  }

  async createPatient(newPatient: Omit<Patient, 'id'>) {
    try {
      console.log('Creating new patient:', newPatient);
      const response = await axiosInstance.post('/patients', newPatient);
      return response.data?.data; // Trả về object bệnh nhân vừa tạo, bao gồm id
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to create patient'
      };
    }
  }
}

export const patientService = new PatientService();
