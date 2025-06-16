import axiosInstance from "./axios";

class MedicalRecordService {
  async getMedicalRecordByDate(startDate: string, endDate: string) {
    const list = [];
    let page = 1;
    const limit = 10; // Tùy theo limit API của bạn
    let hasNext = true;

    while (hasNext) {
      try {
        const response = await axiosInstance.get(
          `/medical-records?startDate=${startDate}&endDate=${endDate}&?page=${page}&limit=${limit}`
        );
        const { data } = response.data;
        list.push(...data);

        if (data.length < limit) {
          hasNext = false;
        } else {
          page++;
        }
      } catch (error: any) {
        throw {
          message: error.response.data.message,
        };
      }
    }

    return list;
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
