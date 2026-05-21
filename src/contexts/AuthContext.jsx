import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

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
  const [error, setError] = useState(null);

  // Restore auth state on app load
  useEffect(() => {
    const restoreAuth = async () => {
      const hasToken = localStorage.getItem("access");
      if (hasToken && !user) {
        await fetchProfile();
      }
    };
    restoreAuth();
  }, []);

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.data.user);
        return { ok: true, user: result.data.user };
      } else {
        const errorMsg = result.error?.detail || result.error?.message || "Login failed";
        setError(errorMsg);
        return { ok: false, error: { message: errorMsg } };
      }
    } catch (err) {
      const errorMsg = err.message || "Login error";
      setError(errorMsg);
      return { ok: false, error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.registerStudent(data);
      if (result.success) {
        setUser(result.data.user);
        return { ok: true, user: result.data.user };
      } else {
        const errorMsg = result.error?.detail || result.error?.message || "Registration failed";
        setError(errorMsg);
        return { ok: false, error: { message: errorMsg } };
      }
    } catch (err) {
      const errorMsg = err.message || "Registration error";
      setError(errorMsg);
      return { ok: false, error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const registerCompany = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.registerCompany(data);
      if (result.success) {
        setUser(result.data.user);
        return { ok: true, user: result.data.user };
      } else {
        const errorMsg = result.error?.detail || result.error?.message || "Registration failed";
        setError(errorMsg);
        return { ok: false, error: { message: errorMsg } };
      }
    } catch (err) {
      const errorMsg = err.message || "Registration error";
      setError(errorMsg);
      return { ok: false, error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const registerStaff = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.registerStaff(data);
      if (result.success) {
        setUser(result.data.user);
        return { ok: true, user: result.data.user };
      } else {
        const errorMsg = result.error?.detail || result.error?.message || "Registration failed";
        setError(errorMsg);
        return { ok: false, error: { message: errorMsg } };
      }
    } catch (err) {
      const errorMsg = err.message || "Registration error";
      setError(errorMsg);
      return { ok: false, error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifyOTP(email, otp);
      if (result.success) {
        setUser(result.data.user);
        return { ok: true, user: result.data.user };
      } else {
        const errorMsg = result.error?.detail || result.error?.message || "OTP verification failed";
        setError(errorMsg);
        return { ok: false, error: { message: errorMsg } };
      }
    } catch (err) {
      const errorMsg = err.message || "OTP error";
      setError(errorMsg);
      return { ok: false, error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user"); // Explicitly remove user from storage
      setUser(null);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const result = await authService.getProfile();
      if (result.success) {
        setUser(result.data);
        return { ok: true, data: result.data };
      } else {
        // User might be logged out
        setUser(null);
        return { ok: false, error: result.error };
      }
    } catch (err) {
      setUser(null);
      return { ok: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        registerStudent,
        registerCompany,
        registerStaff,
        verifyOTP,
        logout,
        fetchProfile,
        isAuthenticated: !!user && !!localStorage.getItem("access"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
