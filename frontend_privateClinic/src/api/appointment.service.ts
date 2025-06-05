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

interface CreateAppointmentData {
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

class AppointmentService {
  async getAppointments(
    params?: AppointmentSearchParams
  ): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get("/appointments", { params });
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

  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const response = await axiosInstance.post("/appointments", data);
      const newAppointment = response.data?.data;

      return {
        id: newAppointment.id,
        patientName: newAppointment.patient_name,
        gender: newAppointment.gender,
        yearOfBirth: newAppointment.birth_year,
        address: newAppointment.address,
        date: new Date(newAppointment.appointment_date).toLocaleDateString(
          "vi-VN"
        ),
        status: newAppointment.status,
      };
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to create appointment",
      };
    }
  }

  async cancelAppointment(id: number, reason: string): Promise<void> {
    try {
      await axiosInstance.patch(`/appointments/${id}/cancel`, { reason });
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to cancel appointment",
      };
    }
  }
}

export const appointmentService = new AppointmentService();
