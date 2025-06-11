import axiosInstance from "./axios";

class PrescriptionService {
  async getPrescription() {
    const list = [];
    let page = 1;
    const limit = 10; // Tùy theo limit API của bạn
    let hasNext = true;

    while (hasNext) {
      try {
        const response = await axiosInstance.get(
          `/prescriptions?page=${page}&limit=${limit}`
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
}

export const prescriptionService = new PrescriptionService();
