import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.38:3000",
});

export default api;