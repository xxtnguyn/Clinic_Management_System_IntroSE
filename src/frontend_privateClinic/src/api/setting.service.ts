import axiosInstance from "./axios";

export interface Setting {
  key: string;
  value: string;
  descriptions?: string;
}

export const settingService = {
  getSettingByKey: async (key: string): Promise<Setting | null> => {
    const response = await axiosInstance.get(`/settings/${key}`);
    return response.data.data || null;
  },

  async getValueByKey(key: string) {
    try {
      const response = await axiosInstance.get(`/settings/key/${key}`);
      return response.data.data.value;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi lấy dữ liệu Setting");
      }
    }
  },

  async updateByKey(setting: Setting) {
    try {
      const response = await axiosInstance.put(
        `/settings/key/${setting.key}`,
        setting
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đã xảy ra lỗi khi update setting.");
      }
    }
  },
};
