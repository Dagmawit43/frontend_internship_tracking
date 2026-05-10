import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { DEPARTMENTS } from "../constants/departments";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const staffRoles = ["Coordinator", "Advisor", "Examiner"];
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      const eligibleStudents = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
      const isEligible = eligibleStudents.some(
        (s) =>
          String(s.studentId).toLowerCase() === String(studentId).toLowerCase() &&
          String(s.email).toLowerCase() === String(email).toLowerCase() &&
          String(s.department).trim().toLowerCase() === String(department).trim().toLowerCase()
      );

      if (!isEligible) {
        setError("You are not eligible to register. Please check that your Student ID, Email, and Department exactly match the official eligibility list.");
        return;
      }
    }

    // For staff roles we will do a fake OTP flow locally (no backend yet)
    if (staffRoles.includes(role)) {
      if (!email) {
        setError("Email is required for registration.");
        return;
      }

      // Enforce invitation-based authorization for Advisors and Examiners
      if (role === "Advisor" || role === "Examiner") {
        const invitations = JSON.parse(localStorage.getItem("pendingInvitations") || "[]");
        const invitation = invitations.find(
          inv => String(inv.email).toLowerCase() === String(email).toLowerCase() &&
                 inv.role === role &&
                 String(inv.department).trim().toLowerCase() === String(department).trim().toLowerCase() &&
                 inv.status === "pending"
        );

        if (!invitation) {
          setError("You are not authorized for this role.");
          return;
        }
      }

      // prepare pending user and trigger OTP step (fake)
      const temp = {
        id: `user-${Date.now()}`,
        role,
        fullName: String(fullName || ""),
        email: String(email).toLowerCase(),
        department: String(department || ""),
        phone: String(phone || ""),
        password: String(password || ""),
        createdAt: new Date().toISOString(),
        source: "local",
      };
      setPendingUser(temp);
      setOtpSent(true);
      return;
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
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const exists = students.some(
        (s) =>
          String(s?.email || "").toLowerCase() === String(email || "").toLowerCase() ||
          String(s?.studentId || s?.id || "").toLowerCase() === String(studentId || "").toLowerCase(),
      );

      if (exists) {
        setError("This student is already registered locally. Please login.");
        return;
      }

      const localStudent = {
        id: String(studentId) || `stu-${Date.now()}`,
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
      setSuccess("Student registration saved locally. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    if (role === "Company") {
      const companies = JSON.parse(localStorage.getItem("companies") || "[]");
      const localCompanyName = String(companyName || "").trim();
      const localEmail = String(email || "").trim().toLowerCase();
      const exists = companies.some(
        (c) =>
          String(c?.companyName || c?.company_name || "").trim().toLowerCase() === localCompanyName.toLowerCase() ||
          String(c?.contactEmail || c?.representative_email || c?.email || "").trim().toLowerCase() === localEmail,
      );

      if (exists) {
        setError("This company is already registered locally. Please login.");
        return;
      }

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
      setSuccess("Company registration saved locally. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
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
          <label className="block text-gray-600 text-sm font-medium mb-1">Register as</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Student">Student</option>
            <option value="Company">Company</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Advisor">Advisor</option>
            <option value="Examiner">Examiner</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 p-3 rounded-md text-sm">{success}</div>
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
              {formData.role === "Student" ? "AASTU Email" : "Contact Email"}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={formData.role === "Student" || ["Coordinator", "Advisor", "Examiner"].includes(formData.role)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              placeholder={formData.role === "Student" ? "example@aastustudent.edu.et" : "contact@company.com"}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Phone Number</label>
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
            <label className="block text-gray-600 text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : formData.role === "Student" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Student ID</label>
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
              <label className="block text-gray-600 text-sm font-medium mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {staffRoles.includes(formData.role) && (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}

        {formData.role === "Company" && (
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">TIN Number</label>
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

        {/* OTP modal (fake) */}
        {otpSent && pendingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Verify Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                A one-time code was sent to {pendingUser.email}. (Fake for now — enter any code.)
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                className="w-full border rounded-md p-2 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setPendingUser(null); setOtpCode(""); }}
                  className="px-4 py-2 rounded-md bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const users = JSON.parse(localStorage.getItem("otherUsers") || "[]");
                    const exists = users.some((u) => u.email === pendingUser.email);
                    if (!exists) {
                      users.push(pendingUser);
                      localStorage.setItem("otherUsers", JSON.stringify(users));

                      if (pendingUser.role === "Advisor" || pendingUser.role === "Examiner") {
                        const invitations = JSON.parse(localStorage.getItem("pendingInvitations") || "[]");
                        const updatedInvitations = invitations.map(inv =>
                          String(inv.email).toLowerCase() === pendingUser.email.toLowerCase() && inv.role === pendingUser.role
                            ? { ...inv, status: "accepted" }
                            : inv
                        );
                        localStorage.setItem("pendingInvitations", JSON.stringify(updatedInvitations));
                      }
                    }
                    setOtpSent(false);
                    setPendingUser(null);
                    setOtpCode("");
                    setSuccess("Registration complete. You can now log in.");
                    setTimeout(() => navigate("/login"), 900);
                  }}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
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
            <label className="block text-gray-600 text-sm font-medium mb-1">Confirm Password</label>
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
