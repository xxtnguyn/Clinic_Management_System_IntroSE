import axiosInstance from "./axios";
import type { AxiosResponse } from "axios";

export interface Staff {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birth_date: string;
  role_id: number;
  is_active: boolean;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class StaffService {
  update(
    staffId: number,
    data: Partial<Staff>
  ): Promise<AxiosResponse<ApiResponse<Staff>>> {
    return axiosInstance.put(`/staff/${staffId}`, data);
  }

  uploadAvatar(
    staffId: number,
    file: File
  ): Promise<AxiosResponse<ApiResponse<{ avatar: string; avatarUrl: string }>>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return axiosInstance.post(`/staff/${staffId}/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default new StaffService();
