import axiosInstance from './axios';
import type { PatientExaminationHistory } from '../api/patient.service';

interface Medicine {
  id: number;
  name: string;
  unit: string;
  price: number;
  quantity_in_stock: number;
  description: string;
}

class MedicalExaminationService {
  async getPatientExaminationByName(name: string): Promise<PatientExaminationHistory[]> {
    try {
      console.log('Fetching patient examination history with name:', name);
      const response = await axiosInstance.get('/patients/view_patient_examination_history', {
        params: { name }
      });
      const data = response.data?.data;
      if (Array.isArray(data)) {
        return data;
      }
      throw { message: 'No patient information found' };
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch examination history'
      };
    }
  }

  async getMedicines(): Promise<Medicine[]> {
    try {
      console.log("Calling /medicines...");
      const response = await axiosInstance.get('/medicines');
      console.log("Response data:", response.data);
      const data = response.data?.data?.medicines || response.data?.data || [];
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          price: item.price,
          quantity_in_stock: item.quantity_in_stock,
          description: item.description || ''
        }));
      }
      throw { message: 'No medicines found' };
    } catch (error: any) {
      console.error("Error fetching medicines:", error);
      throw {
        message: error.response?.data?.message || 'Failed to fetch medicines'
      };
    }
  }
}

export const medicalExaminationService = new MedicalExaminationService();
export const getPatientExaminationByName = medicalExaminationService.getPatientExaminationByName.bind(medicalExaminationService);
export const getMedicines = medicalExaminationService.getMedicines.bind(medicalExaminationService);