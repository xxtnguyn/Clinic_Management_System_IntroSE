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
  status?: string;
  date?: string;
  name?: string;
}

interface InvoiceUpdate {
  status?: string;
  notes?: string;
  payment_date?: string;
}

class InvoiceService {
  async getInvoices(params: InvoiceSearchParams = {}) {
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

  async getInvoiceByDate(startDate: string, endDate: string) {
    try {
      const response = await axiosInstance.get(
        `/invoices?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch invoice by Date",
      };
    }
  }

  async updateInvoice(id: number, data: InvoiceUpdate) {
    try {
      const response = await axiosInstance.put(`/invoices/${id}`, data);
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update invoice",
      };
    }
  }

  async createInvoice(medical_record_id: number, notes: string) {
    try {
      const response = await axiosInstance.post(`/invoices`, {
        medical_record_id: medical_record_id,
        notes: notes,
      });
      return response.data?.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create invoice",
      };
    }
  }

  async getRevenueByDate(date: string) {
    try {
      const response = await axiosInstance.get(
        `/invoices/daily-revenue/${date}`
      );
      return response.data?.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          `Failed to fetch revenue by Date ${date}`,
      };
    }
  }

  async exportInvoicePDF(id: number) {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to export invoice PDF',
      };
    }
  }
}

export const invoiceService = new InvoiceService();
