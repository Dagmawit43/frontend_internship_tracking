import React, { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async ({ identifier, email, password, role }) => {
    setLoading(true);
    let timer;
    try {
      const loginId = String(identifier || email || "").trim();
      const payload = {
        identifier: loginId,
        username: loginId,
        email: loginId,
        password,
        role,
        role_name: role,
        role_name_lower: String(role || "").toLowerCase(),
      };

      const LOGIN_TIMEOUT_MS = 70000;
      const postLogin = async () => {
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error("Login request timed out. Please try again."));
          }, LOGIN_TIMEOUT_MS);
        });

        return Promise.race([
          api.post("/auth/login/", payload, { timeout: LOGIN_TIMEOUT_MS }),
          timeoutPromise,
        ]);
      };

      let resp;
      try {
        resp = await postLogin();
      } catch (firstErr) {
        const msg = String(firstErr?.message || "").toLowerCase();
        const isTimeoutOrNetwork =
          msg.includes("timeout") ||
          msg.includes("network") ||
          msg.includes("failed to fetch") ||
          msg.includes("err_network");

        if (!isTimeoutOrNetwork) throw firstErr;

        await new Promise((resolve) => setTimeout(resolve, 1500));
        resp = await postLogin();
      }
      const data = resp.data;

      // Determine user object dynamically
      let userObj = data.student || data.advisor || data.coordinator || data.examiner || data.company || data;

      // Save tokens if they exist
      if (data.access) localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);

      // Save user info
      localStorage.setItem("user", JSON.stringify(userObj));
      setUser(userObj);

      return { ok: true, user: userObj };
    } catch (err) {
      const errorData = err.response?.data || { message: err.message };
      return { ok: false, error: errorData };
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
  };

  const fetchProfile = async (role = "Student") => {
    try {
      const resp = await api.get(`/auth/${role.toLowerCase()}/profile/`);
      const data = resp.data;
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.response?.data || err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;