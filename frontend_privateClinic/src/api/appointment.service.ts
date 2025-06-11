import axiosInstance from "./axios";

export interface Appointment {
  id: number;
  patientName: string;
  gender: string;
  yearOfBirth: number;
  address: string;
  date: string;
  status: "scheduled" | "completed" | "cancelled";
}

interface AppointmentSearchParams {
  name?: string;
  status?: string;
  date?: string;
}

class AppointmentService {
  async getAppointments(params?: AppointmentSearchParams): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get("/patients", { params });
      const data = response.data?.data || response.data;

      // Chuyển đổi dữ liệu từ backend sang format UI mong muốn
      return data.map((item: any) => ({
        id: item.id,
        patientName: item.full_name,
        gender: item.gender,
        yearOfBirth: item.birth_year,
        address: item.address,
        date: new Date(item.created_at).toLocaleDateString("vi-VN"), // hoặc định dạng khác
        status: "scheduled", // Giả định vì API chưa có status
      }));
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  }

  async createAppointment(data: {
    patientName: string;
    gender: string;
    yearOfBirth: number;
    address: string;
    date: string;
  }): Promise<Appointment> {
    try {
      const response = await axiosInstance.post("/patients", {
        full_name: data.patientName,
        gender: data.gender,
        birth_year: data.yearOfBirth,
        address: data.address,
        created_at: data.date
      });

      const newAppointment = response.data?.data || response.data;
      return {
        id: newAppointment.id,
        patientName: newAppointment.full_name,
        gender: newAppointment.gender,
        yearOfBirth: newAppointment.birth_year,
        address: newAppointment.address,
        date: new Date(newAppointment.created_at).toLocaleDateString("vi-VN"),
        status: "scheduled"
      };
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create appointment"
      };
    }
  }
}

export const appointmentService = new AppointmentService();
