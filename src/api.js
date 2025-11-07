import axios from "axios";

// Base URL comes from Vite env var VITE_API_BASE_URL. If not set, fall back
// to the deployed Render backend URL provided by the user.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://internship-tracking-8.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token helpers
const getAccess = () => localStorage.getItem("access");
const getRefresh = () => localStorage.getItem("refresh");
const setAccess = (token) => localStorage.setItem("access", token);
const setRefresh = (token) => localStorage.setItem("refresh", token);
const clearAuth = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("student");
};

// Attach Authorization header to requests
api.interceptors.request.use((cfg) => {
  const token = getAccess();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Response interceptor: on 401 try once to refresh the access token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
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
      return Promise.reject(error);
    }

    try {
      // Use axios directly to avoid interceptor recursion
      const resp = await axios.post(`${BASE_URL}/token/refresh/`, { refresh: refreshToken });
      const newAccess = resp.data?.access;
      if (!newAccess) throw new Error("No access token in refresh response");

      setAccess(newAccess);
      api.defaults.headers.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
export { getAccess, getRefresh, setAccess, setRefresh, clearAuth };
