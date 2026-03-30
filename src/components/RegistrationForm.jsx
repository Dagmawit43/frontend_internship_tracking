import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { DEPARTMENTS } from "../constants/departments";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "Student",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    studentId: "",
    department: "",
    tinNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getFriendlyErrorMessage = (error) => {
    // Handle API response errors
    if (error?.response?.data) {
      const data = error.response.data;

      // Check for duplicate email
      if (
        data.email ||
        (data.detail && data.detail.toLowerCase().includes("email"))
      ) {
        return "This email address is already registered. Please use a different email or try logging in.";
      }

      // Check for duplicate student ID
      if (
        data.id ||
        (data.detail && data.detail.toLowerCase().includes("id"))
      ) {
        return "This student ID is already registered. Please check your student ID or contact support.";
      }

      // Check for validation errors
      if (data.detail) {
        // If it's a string, try to make it more user-friendly
        const detail = String(data.detail).toLowerCase();
        if (detail.includes("already exists") || detail.includes("duplicate")) {
          return "An account with these details already exists. Please try logging in instead.";
        }
        if (detail.includes("invalid")) {
          return "Please check your information and try again.";
        }
        // For other details, return a generic message
        return "Registration failed. Please check your information and try again.";
      }

      // Check for field-specific errors
      if (typeof data === "object") {
        const errorMessages = Object.values(data).flat();
        if (errorMessages.length > 0) {
          const firstError = String(errorMessages[0]).toLowerCase();
          if (
            firstError.includes("already exists") ||
            firstError.includes("duplicate")
          ) {
            return "An account with these details already exists. Please try logging in instead.";
          }
        }
      }
    }

    // Handle network errors
    if (error?.message) {
      const message = error.message.toLowerCase();
      if (message.includes("network") || message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }
    }

    // Default friendly message
    return "Registration failed. Please check your information and try again. If the problem persists, contact support.";
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
      department,
      tinNumber,
      password,
      confirmPassword,
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
      if (!department) {
        setError("Department is required for student registration.");
        return;
      }
      // Must be pre-uploaded by coordinator in eligibleStudents
      // (Bypassed for local testing)
    }

    if (role === "Company") {
      if (!companyName) {
        setError("Company name is required for company registration.");
        return;
      }
      const tinRegex = /^\d{10}$/;
      if (!tinRegex.test(String(tinNumber || "").trim())) {
        setError("Please enter a valid 10-digit TIN number.");
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
          user: {
            username: String(studentId),
            email: String(email),
            password: String(password),
            first_name: String(fullName.split(" ")[0]),
            last_name: String(
              fullName.split(" ").slice(1).join(" ") || fullName,
            ),
            phone: String(phone),
          },
          student_id: String(studentId),
          department: String(department),
        };

        const response = await api.post("/auth/student/register/", payload);
        console.log("Student Registration Success:", response.data);

        setSuccess("Student registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1400);
      } catch (err) {
        console.error("Student Registration Error:", err);
        const isBackendUnavailable =
          /timeout|network|failed to fetch|err_network/i.test(
            String(err?.message || err?.response?.data?.detail || ""),
          );

        if (isBackendUnavailable) {
          const students = JSON.parse(localStorage.getItem("students") || "[]");
          const exists = students.some(
            (s) =>
              String(s?.email || "").toLowerCase() ===
                String(email || "").toLowerCase() ||
              String(s?.studentId || s?.id || "").toLowerCase() ===
                String(studentId || "").toLowerCase(),
          );

          if (exists) {
            setError(
              "This student is already registered locally. Please login.",
            );
          } else {
            const localStudent = {
              id: String(studentId),
              studentId: String(studentId),
              fullName: String(fullName),
              email: String(email),
              phone: String(phone),
              password: String(password),
              department: String(department),
              createdAt: new Date().toISOString(),
              source: "local",
            };
            students.push(localStudent);
            localStorage.setItem("students", JSON.stringify(students));
            setSuccess(
              "Student registration saved locally. Redirecting to login...",
            );
            setTimeout(() => navigate("/login"), 1400);
          }
          return;
        }

        const status = err?.response?.status;

        if (status === 400 && err?.response?.data) {
          console.error("400 Bad Request Payload Details:", err.response.data);
          setError(
            "Registration request issue exactly: " +
              JSON.stringify(err.response.data),
          );
        } else {
          setError(getFriendlyErrorMessage(err));
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (role === "Company") {
      setIsSubmitting(true);
      try {
        const payload = {
          user: {
            username:
              companyName.replace(/\s/g, "").toLowerCase() ||
              `company_${Date.now()}`,
            email: email || "unknown@company.com",
            password: password || "Test@1234",
            first_name: fullName.split(" ")[0] || "Company",
            last_name:
              fullName.split(" ").slice(1).join(" ") || "Representative",
            phone: String(phone || "0900000000"),
          },
          company_name: companyName || "Unknown Company",
          registration_number: String(tinNumber || `REG-${Date.now()}`),
          tin_number: String(tinNumber || ""),
          industry_type: "Technology",
          address: "Addis Ababa",
          contact_email: email || "unknown@company.com",
          contact_phone: String(phone || "0900000000"),
          website: `https://${(companyName || "company").replace(/\s/g, "").toLowerCase()}.com`,
        };

        const response = await api.post("/auth/company/register/", payload);
        console.log("Company Registration Success:", response.data);

        const companies = JSON.parse(localStorage.getItem("companies") || "[]");
        const localCompanyName = String(companyName || "").trim();
        const localEmail = String(email || "")
          .trim()
          .toLowerCase();
        const exists = companies.some(
          (c) =>
            String(c?.companyName || c?.company_name || "")
              .trim()
              .toLowerCase() === localCompanyName.toLowerCase() ||
            String(c?.contactEmail || c?.representative_email || c?.email || "")
              .trim()
              .toLowerCase() === localEmail,
        );

        if (!exists) {
          companies.push({
            id: Date.now(),
            companyName: localCompanyName,
            company_name: localCompanyName,
            contactEmail: localEmail,
            representative_email: localEmail,
            contactPhone: String(phone || ""),
            representative_name: String(fullName || ""),
            tinNumber: String(tinNumber || ""),
            tin_number: String(tinNumber || ""),
            password: String(password),
            verified: true,
            status: "VERIFIED",
            source: "backend+local",
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("companies", JSON.stringify(companies));
        }

        setSuccess("Company registration submitted successfully!");
        setTimeout(() => navigate("/login"), 1400);
      } catch (err) {
        console.error("Company Registration Error:", err);
        const isBackendUnavailable =
          /timeout|network|failed to fetch|err_network/i.test(
            String(err?.message || err?.response?.data?.detail || ""),
          );

        if (isBackendUnavailable) {
          const companies = JSON.parse(
            localStorage.getItem("companies") || "[]",
          );
          const localCompanyName = String(companyName || "").trim();
          const localEmail = String(email || "")
            .trim()
            .toLowerCase();
          const exists = companies.some(
            (c) =>
              String(c?.companyName || c?.company_name || "")
                .trim()
                .toLowerCase() === localCompanyName.toLowerCase() ||
              String(
                c?.contactEmail || c?.representative_email || c?.email || "",
              )
                .trim()
                .toLowerCase() === localEmail,
          );

          if (exists) {
            setError(
              "This company is already registered locally. Please login.",
            );
          } else {
            const localCompany = {
              id: Date.now(),
              companyName: localCompanyName,
              company_name: localCompanyName,
              contactEmail: localEmail,
              representative_email: localEmail,
              contactPhone: String(phone || ""),
              representative_name: String(fullName || ""),
              tinNumber: String(tinNumber || ""),
              tin_number: String(tinNumber || ""),
              password: String(password),
              verified: true,
              status: "VERIFIED",
              source: "local",
              createdAt: new Date().toISOString(),
            };

            companies.push(localCompany);
            localStorage.setItem("companies", JSON.stringify(companies));
            setSuccess(
              "Company registration saved locally. Redirecting to login...",
            );
            setTimeout(() => navigate("/login"), 1400);
          }
          return;
        }

        const status = err?.response?.status;

        if (status === 400 && err?.response?.data) {
          console.error("400 Bad Request Payload Details:", err.response.data);
          setError(
            "Registration request issue exactly: " +
              JSON.stringify(err.response.data),
          );
        } else {
          setError(getFriendlyErrorMessage(err));
        }
      } finally {
        setIsSubmitting(false);
      }
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
              {formData.role === "Student"
                ? "AASTU Email"
                : "Contact Email (optional)"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {formData.role === "Company" && (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              TIN Number
            </label>
            <input
              type="text"
              name="tinNumber"
              value={formData.tinNumber}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 10-digit TIN"
            />
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
