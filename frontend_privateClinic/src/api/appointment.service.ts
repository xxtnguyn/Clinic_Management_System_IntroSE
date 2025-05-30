import axiosInstance from "./axios";

export interface Appointment {
  id: number;
  patientName: string;
  gender: string;
  yearOfBirth: number;
  address: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface AppointmentSearchParams {
  name?: string;
  status?: string;
  date?: string;
}

class AppointmentService {
  async getAppointments(params: AppointmentSearchParams) {
    try {
      const response = await axiosInstance.get("/appointments", { params });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  }

  async updateAppointmentStatus(id: number, status: string) {
    try {
      const response = await axiosInstance.patch(`/appointments/${id}/status`, {
        status,
      });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          "Failed to update appointment status",
      };
    }
  }

  async updateAppointment(id: number, data: Partial<Appointment>) {
    try {
      const response = await axiosInstance.put(`/appointments/${id}`, data);
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to update appointment",
      };
    }
  }
}

export const appointmentService = new AppointmentService();
