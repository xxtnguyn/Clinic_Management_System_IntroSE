import axiosInstance from "./axios";

export interface DiseaseType {
  id: number;
  name: string;
  description?: string;
}

export const diseaseTypeService = {
  // Get all disease types
  getDiseaseTypes: async (): Promise<DiseaseType[]> => {
    try {
      const response = await axiosInstance.get("/disease-types");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi lấy danh sách loại bệnh.");
      }
    }
  },

  // Get disease type by ID
  getDiseaseTypeById: async (id: number): Promise<DiseaseType> => {
    try {
      const response = await axiosInstance.get(`/disease-types/${id}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi lấy loại bệnh.");
      }
    }
  },

  // Create new disease type
  createDiseaseType: async (
    diseaseType: Omit<DiseaseType, "id">
  ): Promise<DiseaseType> => {
    try {
      const response = await axiosInstance.post("/disease-types", diseaseType);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi tạo loại bệnh.");
      }
    }
  },

  // Update disease type
  updateDiseaseType: async (
    id: number,
    diseaseType: Partial<DiseaseType>
  ): Promise<DiseaseType> => {
    try {
      const response = await axiosInstance.put(
        `/disease-types/${id}`,
        diseaseType
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi cập nhật loại bệnh.");
      }
    }
  },

  // Delete disease type
  deleteDiseaseType: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/disease-types/${id}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi xóa loại bệnh.");
      }
    }
  },
};
