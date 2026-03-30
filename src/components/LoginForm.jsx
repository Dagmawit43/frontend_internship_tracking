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
  const raw = String(value || "").trim().toLowerCase();
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

  const explicitRole =
    toCanonicalRole(user?.role) ||
    toCanonicalRole(user?.role_name) ||
    toCanonicalRole(user?.user_type) ||
    toCanonicalRole(user?.accountType);

  if (explicitRole) return explicitRole;

  const hasCompanyShape =
    !!(user?.companyName || user?.company_name || user?.contactEmail || user?.contact_email || user?.industryType || user?.industry_type);
  if (hasCompanyShape) return "Company";

  const hasStudentShape =
    !!(user?.studentId || user?.student_id) ||
    String(user?.email || "").toLowerCase().endsWith("@aastustudent.edu.et");
  if (hasStudentShape) return "Student";

  return null;
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
      setError("Authentication is not initialized. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        identifier: credential,
        password,
        role: accountType,
      };

      const result = await login(payload);

      if (result.ok) {
        const user = result.user;
        const detectedRole = inferRoleFromUser(user);

        if (detectedRole && detectedRole !== accountType) {
          auth?.logout?.();
          localStorage.removeItem(accountType.toLowerCase());
          setError(`These credentials belong to a ${detectedRole} account. Please select ${detectedRole} as account type.`);
          return;
        }

        localStorage.setItem(accountType.toLowerCase(), JSON.stringify(user));
        navigate(roleRoutes[accountType], {
          state: {
            userName:
              user?.name ||
              user?.fullName ||
              [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
              user?.username ||
              credential,
          },
        });
      } else {
        const errMsg =
          result.error?.detail ||
          result.error?.message ||
          (typeof result.error === "string" ? result.error : "Unable to login. Check your credentials.");

        setError(errMsg);
      }
    } catch (err) {
      setError("Unable to login right now. Please check your credentials and internet connection.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-4 overflow-hidden">
            <img src={logoSrc} alt="AASTU Logo" className="w-full h-full object-cover" />
          </div>
          <p className="text-2xl font-bold text-gray-900 text-center mb-0 tracking-wide uppercase">
            ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY
          </p>
          <h1 className="text-2xl font-bold text-gray-900 text-center">Internship Tracking System</h1>
          <p className="text-gray-500 text-sm mt-2">Welcome back, please sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm">{error}</div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Account type</label>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                setError("");
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(roleRoutes).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <button
            type="button"
            className="w-full text-sm text-blue-600 font-semibold mt-2 hover:underline"
            onClick={() => alert("Please contact your coordinator to reset your password.")}
          >
            Forgot password?
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;