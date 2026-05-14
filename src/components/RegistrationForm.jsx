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
    <div className="flex justify-center items-center app-shell px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="app-auth-card max-w-2xl space-y-5 p-8"
      >
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 tracking-[0.12em] uppercase">
            ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Internship Tracking Registration
          </h2>
        </div>

        <div>
          <label className="app-field-label">Register as</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="app-select"
          >
            <option value="Student">Student</option>
            <option value="Company">Company</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Advisor">Advisor</option>
            <option value="Examiner">Examiner</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            {success}
          </div>
        )}

        <div>
          <label className="app-field-label mb-1">
            {formData.role === "Student" ? "Full Name" : "Representative Name"}
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="app-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="app-field-label mb-1">
              {formData.role === "Student" ? "AASTU Email" : "Contact Email"}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={formData.role === "Student" || ["Coordinator", "Advisor", "Examiner"].includes(formData.role)}
              className="app-input"
              placeholder={formData.role === "Student" ? "example@aastustudent.edu.et" : "contact@company.com"}
            />
          </div>
          <div>
            <label className="app-field-label mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="app-input"
              placeholder="09XXXXXXXX"
            />
          </div>
        </div>

        {formData.role === "Company" ? (
          <div>
            <label className="app-field-label mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="app-input"
            />
          </div>
        ) : formData.role === "Student" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="app-field-label mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className="app-input"
              />
            </div>
            <div>
              <label className="app-field-label mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="app-select"
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
            <label className="app-field-label mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="app-select"
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
            <label className="app-field-label mb-1">TIN Number</label>
            <input
              type="text"
              name="tinNumber"
              value={formData.tinNumber}
              onChange={handleChange}
              required
              maxLength={10}
              className="app-input"
              placeholder="Enter 10-digit TIN"
            />
          </div>
        )}

        {/* OTP modal (fake) */}
        {otpSent && pendingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
            <div className="app-modal-panel w-full max-w-md p-6">
              <h3 className="mb-2 text-lg font-bold text-slate-900">Verify Email</h3>
              <p className="mb-4 text-sm text-slate-600">
                A one-time code was sent to {pendingUser.email}. (Fake for now — enter any code.)
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                className="app-input mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setPendingUser(null); setOtpCode(""); }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
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
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="app-field-label mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="app-input"
            />
          </div>
          <div>
            <label className="app-field-label mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="app-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-indigo-700/15 bg-indigo-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
};

export default RegistrationForm;
