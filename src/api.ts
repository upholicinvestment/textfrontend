//api.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000/api";

const TOKEN_KEYS = ["token", "accessToken", "jwt", "authToken"];

export const getAuthToken = (): string | null => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) {
      try {
        const maybeObj = JSON.parse(v);
        if (maybeObj && typeof maybeObj === "object" && "token" in maybeObj) {
          return String((maybeObj as any).token).replace(/^Bearer\s+/i, "");
        }
      } catch {}
      return v.replace(/^Bearer\s+/i, "");
    }
  }
  return null;
};

export const getUserId = (): string | null => localStorage.getItem("userId");

const DEBUG_USER = import.meta.env.VITE_DEBUG_USER ?? "";

export function extractServerError(err: any): {
  status?: number;
  message: string;
  details?: any;
} {
  const status = err?.response?.status;
  const softFailMsg =
    (err?.response?.data &&
      err.response.data.ok === false &&
      err.response.data.message) ||
    undefined;

  const message =
    softFailMsg ||
    err?.response?.data?.message ||
    err?.message ||
    "Unexpected error occurred";

  const details =
    err?.response?.data?.DEV_DETAILS ||
    err?.response?.data?.details ||
    undefined;

  return { status, message, details };
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  const hLike = config.headers as unknown;

  const setHeaders = (h: Record<string, any>) => {
    const isForm =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (!isForm) h["Content-Type"] = h["Content-Type"] || "application/json";
    h["Accept"] = "application/json";
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (DEBUG_USER) h["X-Debug-User"] = DEBUG_USER;
    return h;
  };

  if (hLike && typeof (hLike as AxiosHeaders).set === "function") {
    const h = hLike as AxiosHeaders;
    const temp: Record<string, any> = {};
    setHeaders(temp);
    for (const [k, v] of Object.entries(temp)) h.set(k, v);
  } else {
    config.headers = setHeaders({
      ...(config.headers as Record<string, any>),
    }) as any;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized (401): token missing/expired/invalid");
    }
    (err as any).clean = extractServerError(err);
    return Promise.reject(err);
  }
);

// helpers
export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}
export async function uploadOrderbook(file: File) {
  const form = new FormData();
  form.append("orderbook", file);
  const { data } = await api.post("/upload-orderbook", form);
  return data;
}

export default api;
