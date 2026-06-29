import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.36:3000";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    console.log("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message,
    });

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// --- Booking API ---
export const bookingApi = {
  createBooking: async (payload: any) => {
    const res = await apiClient.post(`/booking`, payload);
    return res.data;
  },

  // Updated to accept optional location data
  acceptBooking: async (
    bookingId: string,
    driverId: string,
    locationData?: { lat: number; lng: number }
  ) => {
    const res = await apiClient.post(`/booking/${bookingId}/accept`, {
      driverId,
      ...locationData,
    });
    return res.data;
  },

  rejectBooking: async (bookingId: string, driverId: string) => {
    const res = await apiClient.post(`/booking/${bookingId}/reject`, {
      driverId,
    });
    return res.data;
  },

  // Added this function which was missing but used in the Dashboard
  markArrived: async (bookingId: string, driverId: string) => {
    const res = await apiClient.post(`/booking/${bookingId}/arrived`, {
      driverId,
    });
    return res.data;
  },

  // Updated to accept optional end time
  startTrip: async (bookingId: string, otp?: string) => {
    // Adjust payload based on your backend requirements
    const res = await apiClient.post(`/booking/${bookingId}/start`, { otp });
    return res.data;
  },

  endTrip: async (
    bookingId: string,
    driverId: string,
    endTime?: number
  ) => {
    const res = await apiClient.post(`/booking/${bookingId}/end`, {
      driverId,
      endTime,
    });
    return res.data;
  },
};

// --- Driver API ---
export const driverApi = {
  getDriver: async (driverId: string) => {
    const res = await apiClient.get(`/driver/${driverId}`);
    return res.data;
  },

  toggleOnlineStatus: async (driverId: string, isOnline: boolean) => {
    const res = await apiClient.post(`/driver/online/${driverId}`, { isOnline });
    return res.data;
  },

  updateLocation: async (driverId: string, lng: number, lat: number) => {
    const res = await apiClient.put(`/driver/location/${driverId}`, { lng, lat });
    return res.data;
  },

  updateDriver: async (driverId: string, updates: Record<string, any>) => {
    const res = await apiClient.put(`/driver/${driverId}`, updates);
    return res.data;
  },

  getEarnings: async (
    driverId: string,
    period: "today" | "week" | "month" = "today"
  ) => {
    const res = await apiClient.get(
      `/driver/${driverId}/earnings?period=${period}`
    );
    return res.data;
  },
};

export default apiClient;