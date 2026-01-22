import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import companiesData from "../mock/companies.json";
import { Button } from "./ui/Button";

const CompanyLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const match = companiesData.find(
      (c) => c.representative_email.toLowerCase() === email.toLowerCase() && c.password === password
    );

    if (!match) {
      setError("Invalid credentials");
      return;
    }

    if (match.status !== "VERIFIED") {
      setError("Your company is not verified yet.");
      return;
    }

    localStorage.setItem("activeCompany", JSON.stringify(match));
    navigate("/company/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-md p-8 w-full max-w-md space-y-5"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Company Login</h1>
          <p className="text-gray-600 text-sm">Access your company dashboard</p>
        </div>

        {error && <div className="bg-red-100 text-red-600 px-3 py-2 rounded-md text-sm">{error}</div>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button type="submit" className="w-full">
          Log In
        </Button>
      </form>
    </div>
  );
};

export default CompanyLogin;


