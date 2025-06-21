import axiosInstance from "./axios";

export interface UsageInstruction {
  id: number;
  instruction: string;
  description?: string;
}

export const usageInstructionService = {
  getUsageInstructions: async (): Promise<UsageInstruction[]> => {
    const response = await axiosInstance.get("/usage-instructions");
    return response.data.data;
  },
};
