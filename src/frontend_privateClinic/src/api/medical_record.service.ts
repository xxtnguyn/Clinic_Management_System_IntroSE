import axiosInstance from "./axios";

class MedicalRecordService {
  async getMedicalRecordByDate(startDate: string, endDate: string) {
    try {
      const response = await axiosInstance.get(
        `/medical-records?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response.data.message,
      };
    }
  }

  async getPrescriptionsByID(id: number) {
    try {
      const response = await axiosInstance.get(
        `/medical-records/${id}/prescriptions`
      );
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response.data.message,
      };
    }
  }
}

export const medicalRecordService = new MedicalRecordService();
