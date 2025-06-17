import axiosInstance from "./axios";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

class AuthService {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        "/auth/login",
        payload
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message };
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await axiosInstance.get("/auth/me");
    return response.data.data;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await axiosInstance.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    try {
      await axiosInstance.post("/auth/forgot-password", payload);
    } catch (error: any) {
      throw { message: error.response?.data?.message };
    }
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    try {
      await axiosInstance.post("/auth/reset-password", payload);
    } catch (error: any) {
      throw { message: error.response?.data?.message };
    }
  }
}

export const authService = new AuthService();
