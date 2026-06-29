import axios, { AxiosInstance, AxiosError } from "axios";

const BASE_URL = "http://192.168.1.36:3000";

// ---------------------------------------------------------------------------
// Axios instance with interceptors (Same as driver.ts)
// ---------------------------------------------------------------------------
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // const token = await AsyncStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
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
    console.log("❌ Booking API Error:", message);
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// =============================================================================
// BOOKING API
// =============================================================================

export const bookingApi = {
  /**
   * 1. CREATE BOOKING
   * Controller: createBooking(req.body)
   * Route: POST /
   */
  createBooking: async (
    payload: {
      user: string;
      pickupLocation: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
        address?: string;
      };
      dropLocation: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
        address?: string;
      };
      rideType: string;
    }
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`http://192.168.1.36:3000/booking/`, payload);
    return res.data;
  },

  /**
   * 2. ACCEPT BOOKING
   * Controller: acceptBooking(req.params.id, req.body.driverId)
   * Route: POST /:id/accept
   */
  acceptBooking: async (
    bookingId: string,
    driverId: string
  ): Promise<{ success: boolean; data: any }> => {
    // Body must match req.body.driverId
    const res = await apiClient.post(`/booking/${bookingId}/accept`, {
      driverId,
    });
    return res.data;
  },

  /**
   * 3. REJECT BOOKING
   * Controller: rejectBooking(req.params.id, req.body.driverId)
   * Route: POST /:id/reject
   */
  rejectBooking: async (
    bookingId: string,
    driverId: string
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/reject`, {
      driverId,
    });
    return res.data;
  },

  /**
   * 4. START TRIP
   * Controller: startTrip(req.params.id) -> Does NOT read req.body in your code
   * Route: POST /:id/start
   */
  startTrip: async (
    bookingId: string
  ): Promise<{ success: boolean; data: any }> => {
    // Sending empty object {} because controller only uses the ID in the URL
    const res = await apiClient.post(`/booking/${bookingId}/start`, {});
    return res.data;
  },

  /**
   * 5. END TRIP
   * Controller: endTrip(req.params.id, req.body.driverId)
   * Route: POST /:id/end
   */
  endTrip: async (
    bookingId: string,
    driverId: string
  ): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post(`/booking/${bookingId}/end`, {
      driverId,
    });
    return res.data;
  },
};

export default apiClient;