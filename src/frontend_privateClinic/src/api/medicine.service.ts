import axiosInstance from "./axios";

export interface CreateMedicineInput {
  name: string;
  unit: string;
  price: string;
  quantity_in_stock: number;
  description: string;
}

export interface MedicineResponse {
  id: number;
  name: string;
  unit: string;
  price: string;
  quantity_in_stock: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Medicine {
  id: number;
  name: string;
  unit: string;
  quantity_in_stock: number;
  price: string;
  description: string;
}

class MedicineService {
  async getMedicines() {
    const allMedicines: Medicine[] = [];
    let page = 1;
    const limit = 10; // Tùy theo limit API của bạn
    let hasNext = true;

    while (hasNext) {
      try {
        const response = await axiosInstance.get(
          `/medicines?page=${page}&limit=${limit}`
        );
        const { data } = response.data;
        allMedicines.push(...data);

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

    return allMedicines;
  }

  async createMedicine(data: CreateMedicineInput): Promise<MedicineResponse> {
    const res = await axiosInstance.post("/medicines", data);
    return res.data.data;
  }

  async deleteMedicine(id: number) {
    try {
      const response = await axiosInstance.delete(`/medicines/${id}`);
      return response.data; // { success: true, message: "Xóa thành công", ... }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi xóa thuốc.");
      }
    }
  }

  async getStatistics(startDate: string, endDate: string) {
    try {
      const response = await axiosInstance.get(
        `/medicines/statistics?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response.data.message,
      };
    }
  }

  async updateMedicineInformation(medicine: Medicine) {
    try {
      const response = await axiosInstance.put(`/medicines/${medicine.id}`, {
        name: medicine.name,
        unit: medicine.unit,
        price: Number(medicine.price),
        description: medicine.description,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi update thuốc.");
      }
    }
  }

  async addMedicineQuantity(medicine: Medicine) {
    try {
      const response = await axiosInstance.patch(
        `/medicines/${medicine.id}/stock`,
        {
          quantity_in_stock: medicine.quantity_in_stock,
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi thêm số lượng thuốc.");
      }
    }
  }
}
export const medicineService = new MedicineService();
