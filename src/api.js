import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT || 70000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token helpers ─────────────────────────────────────────────────────────────
const getAccess  = () => localStorage.getItem("access");
const getRefresh = () => localStorage.getItem("refresh");
const setAccess  = (token) => localStorage.setItem("access", token);
const setRefresh = (token) => localStorage.setItem("refresh", token);
const clearAuth  = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  localStorage.removeItem("student");
};

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use((cfg) => {
  const token = getAccess();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ── Response interceptor — silent token refresh on 401 / 403 ─────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const looksLikeAuthExpiry = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || "";
  const code = error.response?.data?.code || "";
  const text = `${detail} ${code}`.toLowerCase();

  if (status === 401) return true;

  if (status === 403) {
    return (
      text.includes("token") ||
      text.includes("expired") ||
      text.includes("invalid") ||
      text.includes("not authenticated") ||
      text.includes("credentials")
    );
  }

  return false;
};

const shouldClearSessionOnRefreshFailure = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || "";
  const code = error.response?.data?.code || "";
  const text = `${detail} ${code}`.toLowerCase();

  if (!status) return false;
  if (status >= 500) return false;

  return (
    text.includes("refresh token") ||
    text.includes("token is invalid") ||
    text.includes("token is blacklisted") ||
    text.includes("token not valid") ||
    text.includes("token has expired") ||
    text.includes("no active account") ||
    text.includes("not authenticated") ||
    text.includes("credentials were not provided")
  );
};

const shouldRetry = (error) => {
  const url = error.config?.url || "";
  const isAuthEndpoint =
    url.includes("/auth/login") ||
    url.includes("/token/refresh") ||
    url.includes("/auth/logout");
  return looksLikeAuthExpiry(error) && !isAuthEndpoint && !error.config?._retry;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!shouldRetry(error)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    const refreshToken = getRefresh();

    if (!refreshToken) {
      clearAuth();
      isRefreshing = false;
      // Redirect to login
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      // Use plain axios to avoid triggering this interceptor again
      const resp = await axios.post(`${BASE_URL}/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess  = resp.data?.access;
      const newRefresh = resp.data?.refresh; // present when ROTATE_REFRESH_TOKENS=True

      if (!newAccess) throw new Error("No access token in refresh response");

      setAccess(newAccess);
      if (newRefresh) setRefresh(newRefresh); // save rotated refresh token

      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (shouldClearSessionOnRefreshFailure(refreshError)) {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
export { getAccess, getRefresh, setAccess, setRefresh, clearAuth };
