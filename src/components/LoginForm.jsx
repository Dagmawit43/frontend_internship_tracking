import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hardcoded admin credentials
  const adminCredentials = {
    username: "admin",
    password: "admin123",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = (emailOrUsername || "").trim().toLowerCase();
    const pwd = password;

    // 1️⃣ Admin login (local fallback)
    if (
      (identifier === adminCredentials.username ||
        identifier === "admin@aastu.edu.et") &&
      pwd === adminCredentials.password
    ) {
      navigate("/admin-dashboard");
      return;
    }
    // Use AuthContext login to integrate with backend
    try {
      // use the `login` function from the top-level `useAuth()` call
      const result = await login(identifier, pwd);
      if (result.ok) {
        // fetch student name from localStorage (AuthContext stored it)
        const student = JSON.parse(localStorage.getItem("student"));
        navigate("/student-dashboard", { state: { studentName: student?.fullName } });
        return;
      }
      setError(result.error?.detail || result.error?.message || "Invalid credentials");
      return;
    } catch (e) {
      // If something unexpected happens
      setError(e?.message || "Login failed");
      return;
    }

    // No local fallbacks — backend auth handled via AuthContext.
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Email or Username
          </label>
          <input
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            placeholder="AASTU email or username"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>

        <p className="text-sm text-center text-gray-500 mt-4">
          Need to register?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Click here
          </span>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
