import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL_DEV ;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const driverApi = {
  // ✅ POST /online/:id
  toggleOnlineStatus: async (driverId: string, isOnline: boolean) => {
    const response = await api.post(`/driver/online/${driverId}`, { isOnline });
    return response.data.data;
  },

  // ✅ PUT /location/:id
  updateLocation: async (driverId: string, lng: number, lat: number) => {
    const response = await api.put(`/driver/location/${driverId}`, { lng, lat });
    return response.data.data;
  },

  // ✅ PUT /:id
  updateDriver: async (driverId: string, data: any) => {
    const response = await api.put(`/driver/${driverId}`, data);
    return response.data.data;
  },

  // ✅ POST /
  createDriver: async (data: any) => {
    const response = await api.post(`/driver`, data);
    return response.data.data;
  },

  // ✅ GET /
  getNearbyDrivers: async (lng: number, lat: number, radius: number = 10) => {
    const response = await api.get(`/driver`, { params: { lng, lat, radius } });
    return response.data.data;
  },
};