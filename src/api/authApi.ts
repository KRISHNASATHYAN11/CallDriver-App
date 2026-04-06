import axios from "axios";

// 🔥 IMPORTANT: replace with your IP
const BASE_URL = "http://localhost:3000";

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
  console.log(mobile, 'mobile');
  const res = await api.post("http://192.168.29.42:3000/auth/sendOtp", { mobile });
  return res.data;
};

export const verifyUserOtp = async (mobile: string, otp: string) => {
  const res = await api.post("http://192.168.29.42:3000/auth/verifyOtp", { mobile, otp });
  return res.data;
};

// ==========================
// DRIVER OTP
// ==========================

export const sendDriverOtp = async (mobile: string) => {
  const res = await api.post("http://192.168.29.42:3000/auth/sendDriverOtp", { mobile });
  return res.data;
};

export const verifyDriverOtp = async (mobile: string, otp: string) => {
  const res = await api.post("http://192.168.29.42:3000/auth/verifyDriverOtp", { mobile, otp });
  return res.data;
};


// ==========================
// UPDATE
// ==========================

export const updateUser = async (userId : string, name: string, gender: string) => {
  const res = await api.put(`http://192.168.29.42:3000/customer/${userId}`, { name, gender });
  return res.data;
};

export const updateDriver = async (id: string, data: any) => {
  const res = await api.put(`http://192.168.29.42:3000/driver/${id}`, data);
  return res.data;
};