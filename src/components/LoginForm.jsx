import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";

const roleRoutes = {
  Student: "/student-dashboard",
  Advisor: "/advisor-dashboard",
  Coordinator: "/coordinator-dashboard",
  Examiner: "/examiner-dashboard",
  Company: "/company-dashboard",
};

const toCanonicalRole = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return null;

  const roleMap = {
    student: "Student",
    advisor: "Advisor",
    coordinator: "Coordinator",
    examiner: "Examiner",
    company: "Company",
  };

  return roleMap[raw] || null;
};

const inferRoleFromUser = (user) => {
  if (!user || typeof user !== "object") return null;

  return (
    toCanonicalRole(user?.role) ||
    toCanonicalRole(user?.role_name) ||
    toCanonicalRole(user?.user_type) ||
    toCanonicalRole(user?.accountType) ||
    null
  );
};

const LoginForm = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const login = auth?.login;

  const [accountType, setAccountType] = useState("Student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const credential = (identifier || "").trim();
    if (!credential || !password) {
      setError("Please enter both email/username and password");
      return;
    }

    if (!login) {
      setError(
        "Authentication is not initialized. Please refresh and try again.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // For API login, we use email as the primary credential
      const result = await login({
        email: credential,
        password,
      });

      if (result.ok) {
        const user = result.user;
        const detectedRole = inferRoleFromUser(user);
        const roleToUse = detectedRole || accountType;
        const normalizedUser = { ...user, role: roleToUse };

        localStorage.setItem("user", JSON.stringify(normalizedUser));

        // Also store role-specific key for easier access
        if (roleToUse === "Advisor") {
          localStorage.setItem("advisor", JSON.stringify(normalizedUser));
        } else if (roleToUse === "Coordinator") {
          localStorage.setItem("coordinator", JSON.stringify(normalizedUser));
        } else if (roleToUse === "Examiner") {
          localStorage.setItem("examiner", JSON.stringify(normalizedUser));
        } else if (roleToUse === "Company") {
          localStorage.setItem("company", JSON.stringify(normalizedUser));
        } else if (roleToUse === "Student") {
          localStorage.setItem("student", JSON.stringify(normalizedUser));
        }

        // Redirect based on role
        const dashboardPath = roleRoutes[roleToUse] || "/student-dashboard";
        console.log(`Login successful for role: ${roleToUse}. Redirecting to ${dashboardPath}`);

        navigate(dashboardPath, {
          state: {
            user: normalizedUser,
            userName:
              normalizedUser?.name ||
              normalizedUser?.fullName ||
              [normalizedUser?.first_name, normalizedUser?.last_name]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              normalizedUser?.username ||
              credential,
          },
        });
      } else {
        const errMsg =
          result.error?.detail ||
          result.error?.message ||
          (typeof result.error === "string"
            ? result.error
            : "Invalid email or password");

        setError(errMsg);
      }
    } catch (err) {
      setError(
        "Unable to login. Please check your credentials and internet connection.",
      );
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center app-shell px-4 py-10">
      <div className="app-auth-card max-w-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-600 ring-2 ring-indigo-500/35">
            <img
              src={logoSrc}
              alt="AASTU Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-semibold text-slate-500 text-center mb-1 tracking-[0.12em] uppercase">
            ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY
          </p>
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            Internship Tracking System
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Welcome back, please sign in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="app-field-label">
              Account type
            </label>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                setError("");
              }}
              className="app-select"
            >
              {Object.keys(roleRoutes).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="app-field-label">
              {accountType === "Student"
                ? "AASTU Email"
                : accountType === "Company"
                  ? "Company Email or Name"
                  : "Username or Email"}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="app-input"
              placeholder={
                accountType === "Student"
                  ? "Enter AASTU email or Student ID"
                  : accountType === "Company"
                    ? "Enter company email or name"
                    : "Enter username or email"
              }
            />
          </div>

          <div>
            <label className="app-field-label">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="app-input pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-indigo-700/15 bg-indigo-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <button
            type="button"
            className="mt-2 w-full text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
            onClick={() =>
              alert("Please contact your coordinator to reset your password.")
            }
          >
            Forgot password?
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
