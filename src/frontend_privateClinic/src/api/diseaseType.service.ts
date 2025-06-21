import axiosInstance from "./axios";

export interface DiseaseType {
  id: number;
  name: string;
  description?: string;
}

export const diseaseTypeService = {
  // Get all disease types
  getDiseaseTypes: async (): Promise<DiseaseType[]> => {
    const response = await axiosInstance.get("/disease-types");
    return response.data.data;
  },

  // Get disease type by ID
  getDiseaseTypeById: async (id: number): Promise<DiseaseType> => {
    const response = await axiosInstance.get(`/disease-types/${id}`);
    return response.data;
  },

  // Create new disease type
  createDiseaseType: async (
    diseaseType: Omit<DiseaseType, "id">
  ): Promise<DiseaseType> => {
    const response = await axiosInstance.post("/disease-types", diseaseType);
    return response.data;
  },

  // Update disease type
  updateDiseaseType: async (
    id: number,
    diseaseType: Partial<DiseaseType>
  ): Promise<DiseaseType> => {
    const response = await axiosInstance.put(
      `/disease-types/${id}`,
      diseaseType
    );
    return response.data;
  },

  // Delete disease type
  deleteDiseaseType: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/disease-types/${id}`);
  },
};
