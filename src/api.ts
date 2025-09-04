import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "https://api.upholictech.com/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Pull a useful message + dev details from server errors */
export function extractServerError(err: any): {
  status?: number;
  message: string;
  details?: any;
} {
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message ||
    err?.message ||
    "Unexpected error occurred";
  const details =
    err?.response?.data?.DEV_DETAILS ||
    err?.response?.data?.details ||
    undefined;

  return { status, message, details };
}

// Attach JWT to every request + logging
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  // console.log("[API REQ]", (cfg.method || "GET").toUpperCase(), url, cfg.data ?? "");
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    // console.log("[API RES]", res.status, res.config?.url, res.data ?? "");
    return res;
  },
  (err) => {
    extractServerError(err);
    // console.warn("[API ERR]", status, err.config?.url, message, details ?? "");
    return Promise.reject(err);
  }
);

export default api;
