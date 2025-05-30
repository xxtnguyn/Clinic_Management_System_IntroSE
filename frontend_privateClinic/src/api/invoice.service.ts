import axiosInstance from "./axios";

export interface MedicineItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: number;
  patientName: string;
  examinationDate: string;
  consultantFee: number;
  totalMedicineFee: number;
  medicines: MedicineItem[];
  status: "pending" | "paid";
}

export interface InvoiceSearchParams {
  date?: string;
  name?: string;
  status?: string;
}

class InvoiceService {
  async getInvoices(params: InvoiceSearchParams) {
    try {
      const response = await axiosInstance.get("/invoices", { params });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch invoices",
      };
    }
  }

  async getInvoiceDetails(id: number) {
    try {
      const response = await axiosInstance.get(`/invoices/${id}`);
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch invoice details",
      };
    }
  }

  async updateInvoiceStatus(id: number, status: string) {
    try {
      const response = await axiosInstance.patch(`/invoices/${id}/status`, {
        status,
      });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to update invoice status",
      };
    }
  }
}

export const invoiceService = new InvoiceService();
