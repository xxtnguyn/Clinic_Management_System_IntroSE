import axiosInstance from "./axios";

export interface UsageInstruction {
  id: number;
  instruction: string;
  description?: string;
}

export const usageInstructionService = {
  getUsageInstructions: async (): Promise<UsageInstruction[]> => {
    try {
      const response = await axiosInstance.get("/usage-instructions");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi lấy danh sách cách dùng thuốc.");
      }
    }
  },

  // Create new usage instruction
  createUsageInstruction: async (
    usageInstruction: Omit<UsageInstruction, "id">
  ): Promise<UsageInstruction> => {
    try {
      const response = await axiosInstance.post("/usage-instructions", usageInstruction);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi tạo cách dùng thuốc.");
      }
    }
  },

  // Update usage instruction
  updateUsageInstruction: async (
    id: number,
    usageInstruction: Partial<UsageInstruction>
  ): Promise<UsageInstruction> => {
    try {
      const response = await axiosInstance.put(
        `/usage-instructions/${id}`,
        usageInstruction
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi cập nhật cách dùng thuốc.");
      }
    }
  },

  // Delete usage instruction
  deleteUsageInstruction: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/usage-instructions/${id}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi xóa cách dùng thuốc.");
      }
    }
  },
};
