import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import companiesMock from "../mock/companies.json";

const roleRoutes = {
  Admin: "/admin-dashboard",
  Advisor: "/advisor-dashboard",
  Coordinator: "/coordinator-dashboard",
  Examiner: "/examiner-dashboard",
  Company: "/company-dashboard",
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountType, setAccountType] = useState("Student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const adminCredentials = {
    username: "admin",
    password: "admin123",
  };

  const handleStudentLogin = async (credential, pwd) => {
    const normalized = (credential || "").trim().toLowerCase();

    const matchesStudentId = (student, credLower) => {
      const sid = (student.studentId || student.id || "").toString().toLowerCase();
      return sid && sid === credLower;
    };

    // 1) Check local first (helps offline and avoids API if already registered locally)
    const localStudents = JSON.parse(localStorage.getItem("students")) || [];
    const localMatch = localStudents.find(
      (s) =>
        (s.email?.toLowerCase() === normalized || matchesStudentId(s, normalized)) &&
        s.password === pwd
    );
    if (localMatch) {
      localStorage.setItem("student", JSON.stringify(localMatch));
      navigate("/student-dashboard", {
        state: { studentName: localMatch.fullName || localMatch.name },
      });
      return;
    }

    // 2) Try API
    const result = await login(normalized, pwd);

    // Success via API
    if (result.ok) {
      const student = JSON.parse(localStorage.getItem("student"));
      navigate("/student-dashboard", {
        state: { studentName: student?.name || student?.fullName },
      });
      return;
    }

    const errMsg = (result.error?.detail || result.error?.message || "").toLowerCase();
    const isNetworkError =
      errMsg.includes("network") ||
      errMsg.includes("timeout") ||
      errMsg.includes("fetch") ||
      errMsg.includes("connection") ||
      errMsg.includes("failed to fetch");

    if (!isNetworkError) {
      setError(result.error?.detail || result.error?.message || "Invalid credentials");
      return;
    }

    // 3) Offline fallback: check local students (email or studentId)
    const offlineStudents = JSON.parse(localStorage.getItem("students")) || [];
    const offlineMatch = offlineStudents.find(
      (s) =>
        (s.email?.toLowerCase() === normalized || matchesStudentId(s, normalized)) &&
        s.password === pwd
    );
    if (!offlineMatch) {
      setError("Invalid credentials (offline mode). Make sure you use the same email/ID and password you registered with.");
      return;
    }

    localStorage.setItem("student", JSON.stringify(offlineMatch));
    navigate("/student-dashboard", {
      state: { studentName: offlineMatch.fullName || offlineMatch.name },
    });
  };

  const handleCompanyLogin = () => {
    const credential = identifier.trim().toLowerCase();
    // Seed companies from mock if none exist locally
    const companies =
      JSON.parse(localStorage.getItem("companies"))?.length > 0
        ? JSON.parse(localStorage.getItem("companies"))
        : companiesMock;
    const match = companies.find((company) => {
      const emailMatches = company.contactEmail?.toLowerCase() === credential;
      const companyNameMatches = company.companyName?.toLowerCase() === credential;
      return (emailMatches || companyNameMatches) && company.verified === true;
    });

    if (!match) {
      setError("No verified company account found for those credentials. Please wait for admin verification.");
      return;
    }

    if (match.password !== password) {
      setError("Invalid credentials");
      return;
    }

    const payload = {
      companyName: match.companyName,
      contactEmail: match.contactEmail,
      role: "Company",
      id: match.id,
      status: match.status,
    };
    localStorage.setItem("activeCompanyUser", JSON.stringify(payload));
    localStorage.setItem("activeCompany", JSON.stringify(payload));
    navigate(roleRoutes.Company);
  };

  const handleStaffLogin = () => {
    const credential = identifier.trim().toLowerCase();
    const others = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const match = others.find((user) => {
      const roleMatches = (user.role || "").toLowerCase() === accountType.toLowerCase();
      const usernameMatches = user.username?.toLowerCase() === credential;
      const emailMatches = user.email?.toLowerCase() === credential;
      return roleMatches && (usernameMatches || emailMatches);
    });

    if (!match) {
      setError(`No ${accountType} account found for those credentials.`);
      return;
    }

    if (match.password !== password) {
      setError("Invalid credentials");
      return;
    }

    localStorage.setItem(
      "activeStaffUser",
      JSON.stringify({
        username: match.username,
        email: match.email,
        role: match.role,
        department: match.department || "",
      })
    );
    const targetRoute = roleRoutes[accountType] || "/login";
    navigate(targetRoute);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const credential = (identifier || "").trim();
    const pwd = password;

    if (!credential) {
      setError("Please enter your credentials");
      return;
    }

    if (accountType === "Admin") {
      if (
        (credential.toLowerCase() === adminCredentials.username ||
          credential.toLowerCase() === "admin@aastu.edu.et") &&
        pwd === adminCredentials.password
      ) {
        navigate(roleRoutes.Admin);
        return;
      }
      setError("Invalid admin credentials");
      return;
    }

    if (accountType === "Student") {
      await handleStudentLogin(credential, pwd);
    } else if (accountType === "Company") {
      handleCompanyLogin();
    } else {
      handleStaffLogin();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-4 overflow-hidden">
            <img
              src={logoSrc}
              alt="AASTU Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-2xl font-bold text-gray-900 text-center mb-0 tracking-wide uppercase">
            ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY
          </p>
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Internship Tracking System
          </h1>
          <p className="text-gray-500 text-sm mt-2">Welcome back, please sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Account type
            </label>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                setError("");
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
              <option value="Advisor">Advisor</option>
              <option value="Coordinator">Coordinator</option>
              <option value="Examiner">Examiner</option>
              <option value="Company">Company</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {accountType === "Student" 
                ? "AASTU Email" 
                : accountType === "Company" 
                ? "Company Email or Company Name" 
                : "Username or Email"}
            </label>
            <input
              type={accountType === "Student" ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                accountType === "Student"
                  ? "example@aastustudent.edu.et"
                  : accountType === "Company"
                  ? "Enter company email or company name"
                  : "Enter username or email"
              }
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Log in
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
