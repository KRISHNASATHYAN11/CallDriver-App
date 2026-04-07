import axios, { AxiosInstance, AxiosError } from "axios";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL_DEV || "http://192.168.29.15:3000";

// ---------------------------------------------------------------------------
// Axios instance with interceptors
// ---------------------------------------------------------------------------
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token if present
apiClient.interceptors.request.use(
  (config) => {
    // Add JWT token here if you use auth:
    // const token = await AsyncStorage.getItem("driver_token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — normalise errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    console.log("❌ API Error:", message);
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

// ---------------------------------------------------------------------------
// Helper: convert image URI → base64 using fetch API (no extra packages)
// ---------------------------------------------------------------------------
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

// =============================================================================
// DRIVER API
// =============================================================================
export const driverApi = {
  /** Selfie verification — called before going online */
  verifySelfie: async (
    driverId: string,
    selfieBase64: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/driver/${driverId}/verify-selfie`, {
      selfie: selfieBase64,
      verifiedAt: new Date().toISOString(),
    });
    return res.data;
  },

  /** Toggle driver online / offline status */
  toggleOnlineStatus: async (
    driverId: string,
    isOnline: boolean,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/driver/online/${driverId}`, {
      isOnline,
    });
    return res.data;
  },

  /** Update driver profile fields */
  updateDriver: async (
    driverId: string,
    updates: Record<string, any>,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.put(`/driver/${driverId}`, updates);
    return res.data;
  },

  /** Get driver profile */
  getDriver: async (
    driverId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/driver/${driverId}`);
    return res.data;
  },

  /** Update live location — persisted to DB */
 updateLocation: async (
  driverId: string,
  lng: number,
  lat: number,
): Promise<{ success: boolean; data: any }> => {

  const res = await apiClient.put(`/driver/location/${driverId}`, {
    lng,
    lat,
  });

  return res.data;
},

  /** Get earnings for a period */
  getEarnings: async (
    driverId: string,
    period: "today" | "week" | "month" = "today",
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(
      `/driver/${driverId}/earnings?period=${period}`,
    );
    return res.data;
  },

  /** Update FCM push-notification token */
  updateFcmToken: async (
    driverId: string,
    fcmToken: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.patch(`/driver/${driverId}/fcm-token`, {
      fcmToken,
    });
    return res.data;
  },
};

// =============================================================================
// BOOKING API
// =============================================================================
export const bookingApi = {
  /** Accept a booking */
  acceptBooking: async (
    bookingId: string,
    driverId: string,
    driverLocation: { lat: number; lng: number },
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/accept`, {
      driverId,
      driverLocation,
    });
    return res.data;
  },

  /** Reject / decline a booking */
  rejectBooking: async (
    bookingId: string,
    driverId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/reject`, {
      driverId,
    });
    return res.data;
  },

  /** Start trip — server verifies OTP */
  startTrip: async (
    bookingId: string,
    otp: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/start`, {
      otp,
    });
    return res.data;
  },

  /** End / complete trip */
  endTrip: async (
    bookingId: string,
    driverId: string,
    endTime: number,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/end`, {
      driverId,
      endTime: new Date(endTime).toISOString(),
    });
    return res.data;
  },

  /** Mark driver as arrived at pickup */
  markArrived: async (
    bookingId: string,
    driverId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/arrive`, {
      driverId,
    });
    return res.data;
  },

  /** Get single booking details */
  getBooking: async (
    bookingId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/booking/${bookingId}`);
    return res.data;
  },

  /** Get driver's currently active booking */
  getActiveBooking: async (
    driverId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/booking/driver/${driverId}/active`);
    return res.data;
  },
};

// =============================================================================
// NOTIFICATION API
// =============================================================================
export const notificationApi = {
  getNotifications: async (
    driverId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/notifications/${driverId}`);
    return res.data;
  },
  markRead: async (
    notificationId: string,
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },
};

export default apiClient;
