import axiosInstance from "./axios";

export interface Appointment {
  id: number;
  // patient_id: number;
  appointment_date: string; // ISO format
  appointment_time: string;
  status: string;
  patient_name: string;
  gender: string;
  birth_year: number;
  address: string;
  notes: string;
  phone: string;
}

export interface CreateAppointmentPayload {
  patient_id: number;
  appointment_date: string;
  appointment_time: string;
  notes: string;
}


class AppointmentService {
  async getAppointments(status = "", date = "", name = "") {
    try {
      console.log(
        "Fetching appointments with status:",
        status,
        "date:",
        date,
        "name:",
        name
      );
      const response = await axiosInstance.get("/appointments", {
        params: {
          status,
          date,
          name,
        },
      });
      return response.data?.data as Appointment[];
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch appointments",
      };
    }
  }

  async getAppointmentById(id: number): Promise<Appointment> {
    try {
      const response = await axiosInstance.get(`/appointments/${id}`);
      return response.data?.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch appointment"
      );
    }
  }

  async updateAppointment(
    id: number,
    data: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>
  ): Promise<Appointment> {
    try {
      console.log("Updating appointment with data:", data);

      // --- Test gửi 4 trường lần lượt ---
    // const fieldsToTest = [
    //   { appointment_date: "2025-05-15T00:00:00.000Z" },
    //   { appointment_time:  "10:00:00" },
    //   { status: "waiting" },
    //   { notes: "test2" },
    // ];

    // for (const field of fieldsToTest) {
    //   const key = Object.keys(field)[0];
    //   const value = field[key as keyof typeof field];
    //   if (value === undefined || value === null || value === "") continue;

    //   try {
    //     const resTest = await axiosInstance.put(`/appointments/${id}`, field);
    //     console.log(`Test update ${key} success:`, resTest.data);
    //   } catch (errTest) {
    //     console.error(`Test update ${key} failed:`, errTest);
    //   }
    // }
    // --- Kết thúc test ---
      
      const response = await axiosInstance.put(`/appointments/${id}`, data);
      return response.data?.data;
    } catch (error: any) {
      console.error("Update error response:", error.response);
      const message =
        error.response?.data?.message ||
        (typeof error.message === "string"
          ? error.message
          : "Failed to update appointment");
      throw new Error(message);
    }
  }

  async createAppointment(
    data: CreateAppointmentPayload
  ): Promise<Appointment> {
    try {
      console.log("Creating appointment with data:", data);
      const response = await axiosInstance.post("/appointments", data);
      return response.data?.data;
    } catch (error: any) {
      console.error("Create error response:", error.response);
      const message =
        error.response?.data?.message ||
        (typeof error.message === "string"
          ? error.message
          : "Failed to create appointment");
      throw new Error(message);
    }
  }
}

export const appointmentService = new AppointmentService();
