import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

/** Resolve API base from either env var (new or legacy) */
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??
  "https://api.upholictech.com/api";

/* ---------------- token + user helpers ---------------- */
const TOKEN_KEYS = ["token", "accessToken", "jwt", "authToken"];

export const getAuthToken = (): string | null => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) {
      // handle: "Bearer abc", raw "abc", or JSON-stringified token
      try {
        const maybeObj = JSON.parse(v);
        if (maybeObj && typeof maybeObj === "object" && "token" in maybeObj) {
          return String((maybeObj as any).token).replace(/^Bearer\s+/i, "");
        }
      } catch {
        /* not JSON, ignore */
      }
      return v.replace(/^Bearer\s+/i, "");
    }
  }
  return null;
};

export const getUserId = (): string | null => localStorage.getItem("userId");

// Optional (dev only) if your backend supports X-Debug-User in PUBLIC_MODE
const DEBUG_USER = import.meta.env.VITE_DEBUG_USER ?? "";

/* ---------------- error extractor (kept from your old api.ts) ---------------- */
export function extractServerError(err: any): {
  status?: number;
  message: string;
  details?: any;
} {
  const status = err?.response?.status;
  // handle soft-fail pattern { ok:false, message, ... } returned with HTTP 200
  const softFailMsg =
    (err?.response?.data && err.response.data.ok === false && err.response.data.message) || undefined;

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

/* ---------------- axios instance ---------------- */
export const api = axios.create({
  baseURL: API_BASE,
  // keep credentials ON to be compatible with any cookie-based endpoints you may still have
  withCredentials: true,
});

// Attach JWT + headers to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  const hLike = config.headers as unknown;

  // We avoid setting a global Content-Type so multipart/FormData can work (axios sets it)
  const setHeaders = (h: Record<string, any>) => {
    // Set Content-Type to JSON only when body is not FormData
    const isForm = typeof FormData !== "undefined" && config.data instanceof FormData;
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

// Pass-through success, normalize 401s
api.interceptors.response.use(
  (res) => {
    // If a backend uses the `{ ok:false }` soft-fail pattern with 200,
    // you can turn those into rejected promises here if you prefer:
    // if (res?.data && res.data.ok === false) {
    //   return Promise.reject({ response: { status: 200, data: res.data } });
    // }
    return res;
  },
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized (401): token missing/expired/invalid");
      // Optional: clear local token or redirect to login
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    // Surface a consistent error shape to callers
    (err as any).clean = extractServerError(err);
    return Promise.reject(err);
  }
);

/* ---------- Optional convenience helpers (unchanged style) ---------- */
// Example GET: stats
export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}

// Example POST: upload orderbook — DO NOT set Content-Type manually
export async function uploadOrderbook(file: File) {
  const form = new FormData();
  form.append("orderbook", file);
  const { data } = await api.post("/upload-orderbook", form);
  return data;
}

export default api;
