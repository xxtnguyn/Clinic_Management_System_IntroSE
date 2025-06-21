import axiosInstance from "./axios";

export interface PrescriptionPayload {
  medical_record_id: number;
  medicine_id: number;
  staff_id: number;
  quantity: number;
  usage_instruction_id: number;
  notes?: string;
}

export const prescriptionService = {
  createPrescription: async (payload: PrescriptionPayload) => {
    const response = await axiosInstance.post("/prescriptions", payload);
    return response.data;
  },
};
