import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student")) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const resp = await api.post("/api/students/login/", { email, password });
      const { access, refresh, student: studentPayload } = resp.data;
      if (access) localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);
      if (studentPayload) {
        localStorage.setItem("student", JSON.stringify(studentPayload));
        setStudent(studentPayload);
      }
      setLoading(false);
      return { ok: true };
    } catch (err) {
      setLoading(false);
      const errorData = err.response?.data || { message: err.message };
      return { ok: false, error: errorData };
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("student");
    setStudent(null);
  };

  const fetchProfile = async () => {
    try {
      const r = await api.get("/api/students/profile/");
      setStudent(r.data);
      localStorage.setItem("student", JSON.stringify(r.data));
      return { ok: true, data: r.data };
    } catch (e) {
      return { ok: false, error: e.response?.data || e.message };
    }
  };

  useEffect(() => {
    // optionally refresh profile on mount
  }, []);

  return (
    <AuthContext.Provider value={{ student, login, logout, fetchProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
