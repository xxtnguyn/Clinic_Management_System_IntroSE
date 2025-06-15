import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Không tự động redirect 401 — để mỗi component xử lý lỗi riêng
    if (status === 401 && !message) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    // Luôn ném lỗi ra để component bắt và hiển thị
    return Promise.reject(error);
  }
);




export default axiosInstance;
