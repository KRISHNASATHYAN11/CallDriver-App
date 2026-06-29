import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Update this IP to match your local backend if testing on a physical device
const BASE_URL = "http://192.168.1.36:3000";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

// Request Interceptor: Automatically attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Error retrieving token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    // Log detailed error for debugging
    console.log("❌ API Error Details:", {
      url: error.config?.url,
      status: error.response?.status,
      message: message,
      data: error.response?.data,
    });

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a local file URI to a Base64 string for image uploads
 */
export async function uriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    throw new Error("Failed to convert image: " + err.message);
  }
}

// =========================================================================
// DRIVER API
// =========================================================================

export const driverApi = {
  /**
   * Fetch driver profile details
   */
  getDriver: async (driverId: string) => {
    const res = await apiClient.get(`/driver/${driverId}`);
    return res.data;
  },

  /**
   * Toggle Online/Offline status
   */
  toggleOnlineStatus: async (driverId: string, isOnline: boolean) => {
    const res = await apiClient.post(`/driver/online/${driverId}`, {
      isOnline,
    });
    return res.data;
  },

  /**
   * Update driver's current live location
   */
  updateLocation: async (driverId: string, lng: number, lat: number) => {
    const res = await apiClient.put(`/driver/location/${driverId}`, {
      lng,
      lat,
    });
    return res.data;
  },

  /**
   * Update driver profile (e.g., name, photo)
   */
  updateDriver: async (driverId: string, updates: Record<string, any>) => {
    const res = await apiClient.put(`/driver/${driverId}`, updates);
    return res.data;
  },

  /**
   * Fetch earnings stats
   */
  getEarnings: async (
    driverId: string,
    period: "today" | "week" | "month" = "today",
  ) => {
    const res = await apiClient.get(
      `/driver/${driverId}/earnings?period=${period}`,
    );
    return res.data;
  },
};

// =========================================================================
// BOOKING API
// =========================================================================

export const bookingApi = {
  /**
   * Accept a booking request
   */
  acceptBooking: async (
    bookingId: string,
    driverId: string,
    driverLocation: { lat: number; lng: number },
  ) => {
    const res = await apiClient.post(`/booking/${bookingId}/accept`, {
      driverId,
      driverLocation,
    });
    return res.data;
  },

  /**
   * Reject a booking request
   */
  rejectBooking: async (bookingId: string, driverId: string) => {
    const res = await apiClient.post(`/booking/${bookingId}/reject`, {
      driverId,
    });
    return res.data;
  },

  /**
   * Mark driver as arrived at pickup location
   */
  markArrived: async (bookingId: string, driverId: string) => {
    const res = await apiClient.post(`/booking/${bookingId}/arrive`, {
      driverId,
    });
    return res.data;
  },

  /**
   * Start the trip after verifying OTP
   */
  startTrip: async (bookingId: string, otp: string) => {
    const res = await apiClient.post(`/booking/${bookingId}/start`, { otp });
    return res.data;
  },

  /**
   * End the trip and calculate final fare
   */
  endTrip: async (
    bookingId: string,
    driverId: string,
    endTime: string | number,
  ) => {
    const res = await apiClient.post(`/booking/${bookingId}/end`, {
      driverId,
      endTime, // Passing timestamp or ISO string
    });
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Default Export
// ---------------------------------------------------------------------------

export default apiClient;
