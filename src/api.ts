import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8001/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Debug logs so you can confirm method and URL
api.interceptors.request.use((cfg) => {
  console.log("[API REQ]", cfg.method?.toUpperCase(), cfg.baseURL, cfg.url);
  return cfg;
});
api.interceptors.response.use(
  (res) => {
    console.log("[API RES]", res.status, res.config.url);
    return res;
  },
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err.message;
    console.warn("[API ERR]", status, err.config?.url, msg);
    return Promise.reject(err);
  }
);

export default api;
