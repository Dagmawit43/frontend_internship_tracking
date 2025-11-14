import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "Student",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    documentName: "",
    documentData: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        documentName: file.name,
        documentData: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const {
      role,
      fullName,
      companyName,
      email,
      phone,
      studentId,
      password,
      confirmPassword,
      documentData,
      documentName,
    } = formData;

    if (role === "Student") {
      if (!email.endsWith("@aastustudent.edu.et")) {
        setError("Only AASTU email addresses are allowed for students.");
        return;
      }
      if (!studentId) {
        setError("Student ID is required for student registration.");
        return;
      }
    }

    if (role === "Company") {
      if (!companyName) {
        setError("Company name is required for company registration.");
        return;
      }
      if (!documentData) {
        setError("Please upload a verification document for your company.");
        return;
      }
    }

    const phoneRegex = /^[0-9]{9,15}$/;
    if (!phoneRegex.test(phone)) {
      setError("Enter a valid phone number (digits only, 9–15 characters).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "Student") {
      setIsSubmitting(true);
      try {
        const payload = {
          name: fullName,
          email,
          password,
          phone,
          id: studentId,
          image: null,
        };

        await api.post("/api/students/register/", payload);

        setSuccess("Student registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1400);
      } catch (err) {
        const data = err.response?.data || err.message;
        setError(
          data?.detail || data?.message || JSON.stringify(data) || "Registration failed"
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (role === "Company") {
      const companies = JSON.parse(localStorage.getItem("companies")) || [];
      const newCompany = {
        id: Date.now(),
        companyName,
        contactEmail: email,
        phone,
        password,
        verified: false,
        documentName,
        documentData,
        createdAt: new Date().toISOString(),
      };
      companies.push(newCompany);
      localStorage.setItem("companies", JSON.stringify(companies));

      setSuccess(
        "Company registration submitted. An admin will verify your company before it becomes visible to students."
      );
      setFormData({
        role: "Student",
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        studentId: "",
        password: "",
        confirmPassword: "",
        documentName: "",
        documentData: "",
      });
      return;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-5"
      >
        <div className="text-center">
          <p className="text-sm text-gray-700 font-semibold tracking-wide">
            ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            Internship Tracking Registration
          </h2>
        </div>

        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Register as
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Student">Student</option>
            <option value="Company">Company</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 p-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            {formData.role === "Student" ? "Full Name" : "Representative Name"}
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              {formData.role === "Student" ? "AASTU Email" : "Contact Email (optional)"}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={formData.role === "Student"}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              placeholder={
                formData.role === "Student"
                  ? "example@aastu.edu.et"
                  : "contact@company.com"
              }
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="09XXXXXXXX"
            />
          </div>
        </div>

        {formData.role === "Company" ? (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.role === "Company" && (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Verification Document
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="w-full"
            />
            {formData.documentName && (
              <p className="text-sm text-gray-600 mt-1">
                Uploaded: {formData.documentName}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
};

export default RegistrationForm;
