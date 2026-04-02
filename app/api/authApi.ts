import axios from "axios";

// 🔥 IMPORTANT: replace with your IP
const BASE_URL = "http://192.168.15/api/auth";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================
// USER OTP
// ==========================

export const sendUserOtp = async (mobile: string) => {
  const res = await api.post("/sendOtp", { mobile });
  return res.data;
};

export const verifyUserOtp = async (mobile: string, otp: string) => {
  const res = await api.post("/verifyOtp", { mobile, otp });
  return res.data;
};

// ==========================
// DRIVER OTP
// ==========================

export const sendDriverOtp = async (mobile: string) => {
  const res = await api.post("/sendDriverOtp", { mobile });
  return res.data;
};

export const verifyDriverOtp = async (mobile: string, otp: string) => {
  const res = await api.post("/verifyDriverOtp", { mobile, otp });
  return res.data;
};

// ==========================
// UPDATE
// ==========================

export const updateUser = async (id: string, data: any) => {
  const res = await api.post(`/updateUser/${id}`, data);
  return res.data;
};

export const updateDriver = async (id: string, data: any) => {
  const res = await api.post(`/updateDriver/${id}`, data);
  return res.data;
};