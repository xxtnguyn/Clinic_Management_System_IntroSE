import axiosInstance from "./axios";

export interface MedicalRecordPayload {
  patient_id: number;
  examination_date: string; // YYYY-MM-DD
  symptoms: string;
  diagnosis: string;
  disease_type_id: number;
  staff_id: number;
  status: string;
}

export const medicalRecordService = {
  createMedicalRecord: async (payload: MedicalRecordPayload) => {
    const response = await axiosInstance.post("/medical-records", payload);
    return response.data;
  },
};
