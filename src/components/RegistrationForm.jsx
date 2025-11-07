import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "Student", // or 'Company'
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
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear field-specific error when user edits that field
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
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

  const handleSubmit = (e) => {
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

    // Role-specific validations
    if (role === "Student") {
      if (!email.endsWith("@aastu.edu.et")) {
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
      // Companies must upload a document for verification
      if (!documentData) {
        setError("Please upload a verification document for your company.");
        return;
      }
    }

    // Phone validation (digits only, 9–15 characters)
    const phoneRegex = /^[0-9]{9,15}$/;
    if (!phoneRegex.test(phone)) {
      setError("Enter a valid phone number (digits only, 9–15 characters).");
      return;
    }

    // Password match validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "Student") {
      // Send registration to backend
      (async () => {
        setLoading(true);
        setFieldErrors({});
        try {
          const payload = {
            // backend expects `name` and `id` (not full_name / id_number)
            name: fullName,
            email,
            password,
            phone,
            id: studentId,
            image: null,
          };

          await api.post("/api/students/register/", payload);

          setSuccess(
            "Student registration successful! Redirecting to login..."
          );
          setTimeout(() => navigate("/login"), 1400);
        } catch (err) {
          const data = err.response?.data;

          // Backend may return a field-level error object like:
          // { id: ["student with this id already exists."], email: ["..."] }
          if (data && typeof data === "object") {
            // collect field messages and a general message
            const fieldErrs = {};
            const messages = [];
            Object.entries(data).forEach(([k, v]) => {
              // v may be an array of messages or a string
              const msg = Array.isArray(v) ? v.join(" ") : String(v);
              fieldErrs[k === "id" ? "studentId" : k] = msg;
              messages.push(msg);
            });
            setFieldErrors(fieldErrs);
            setError(messages.join(" "));
          } else {
            setError(
              err.response?.data?.detail || err.message || "Registration failed"
            );
          }
        } finally {
          setLoading(false);
        }
      })();

      return;
    }

    // Company registration: store under 'companies' with verified:false
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
      // do not redirect automatically — let user go to login if they want
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          {formData.role === "Student"
            ? "Student Registration"
            : "Company Registration"}
        </h2>

        {/* Role selector */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Register as
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="Student">Student</option>
            <option value="Company">Company</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-3 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 p-2 mb-3 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* Full Name or Company Representative / Name */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            {formData.role === "Student" ? "Full Name" : "Representative Name"}
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
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
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            placeholder={
              formData.role === "Student"
                ? "example@aastu.edu.et"
                : "contact@company.com"
            }
          />
          {fieldErrors.email && (
            <div className="text-sm text-red-600 mt-1">{fieldErrors.email}</div>
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            placeholder="09XXXXXXXX"
          />
        </div>

        {/* Company Name or Student ID */}
        {formData.role === "Company" ? (
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            />
            {fieldErrors.studentId && (
              <div className="text-sm text-red-600 mt-1">
                {fieldErrors.studentId}
              </div>
            )}
          </div>
        )}

        {/* Company verification document upload */}
        {formData.role === "Company" && (
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Verification Document
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            {formData.documentName && (
              <div className="text-sm text-gray-600 mt-1">
                Uploaded: {formData.documentName}
              </div>
            )}
          </div>
        )}

        {/* Password */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-md text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Already have an account */}
        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Click here
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegistrationForm;
