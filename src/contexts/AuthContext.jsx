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
    // Local-only login to support UI work without backend
    setLoading(true);
    try {
      const loginId = String(identifier || email || "")
        .trim()
        .toLowerCase();

      const matchUser = (u) => {
        if (!u) return false;
        const uEmails = [
          u.email,
          u.contactEmail,
          u.representative_email,
          u.contact_email,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        const uNames = [u.username, u.fullName, u.studentId, u.id, u.companyName, u.company_name]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        const idMatch = uEmails.includes(loginId) || uNames.includes(loginId);
        const passMatch =
          String(u.password || u.password_hash || "") ===
          String(password || "");
        return idMatch && passMatch;
      };

      // Role-prioritized local lookup to avoid ambiguous matches
      const roleLower = String(role || "").toLowerCase();

      const companies = JSON.parse(localStorage.getItem("companies") || "[]");
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const otherUsers = JSON.parse(localStorage.getItem("otherUsers") || "[]");

      // Require explicit role selection and search only the corresponding collection.
      if (!roleLower) {
        return {
          ok: false,
          error: { message: "Role is required for local login" },
        };
      }

      if (roleLower === "company") {
        const company = companies.find((u) => matchUser(u));
        if (company) {
          const saved = { ...company, role: "Company" };
          localStorage.setItem("user", JSON.stringify(saved));
          setUser(saved);
          return { ok: true, user: saved, local: true };
        }
        return {
          ok: false,
          error: { message: "Company credentials not found" },
        };
      }

      if (roleLower === "student") {
        const student = students.find((u) => matchUser(u));
        if (student) {
          const saved = { ...student, role: "Student" };
          localStorage.setItem("user", JSON.stringify(saved));
          setUser(saved);
          return { ok: true, user: saved, local: true };
        }
        return {
          ok: false,
          error: { message: "Student credentials not found" },
        };
      }

      if (["coordinator", "advisor", "examiner", "staff"].includes(roleLower)) {
        const other = otherUsers.find(
          (u) => matchUser(u) && String(u.role).toLowerCase() === roleLower
        );
        if (other) {
          const roleCap =
            roleLower.charAt(0).toUpperCase() + roleLower.slice(1);
          const saved = { ...other, role: roleCap };
          localStorage.setItem("user", JSON.stringify(saved));
          setUser(saved);
          return { ok: true, user: saved, local: true };
        }
        return {
          ok: false,
          error: { message: `${roleLower} credentials not found. Please ensure you have selected the correct account type.` },
        };
      }

      return {
        ok: false,
        error: { message: "Unsupported role for local login" },
      };
    } catch (err) {
      return { ok: false, error: { message: err.message } };
    } finally {
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
      // fallback to local stored user for UI development
      const local = JSON.parse(localStorage.getItem("user") || "null");
      if (local) return { ok: true, data: local };
      return { ok: false, error: err.response?.data || err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, fetchProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
