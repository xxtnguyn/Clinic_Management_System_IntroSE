import axiosInstance from './axios';

export interface PatientExaminationHistory {
    "id": number;
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
                message: error.response.data.message
            }
        }
    }
}

export const patientService = new PatientService(); 