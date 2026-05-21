import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS } from "../constants/departments";
import { authService } from "../services/authService";
import { toast } from "../utils/toast";

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
    setIsSubmitting(true);

    console.log("🔵 Form submitted with role:", formData.role);
    console.log("📋 Form data:", formData);

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

    try {
      // Common validation
      const phoneRegex = /^[0-9]{9,15}$/;
      if (!phoneRegex.test(phone)) {
        setError("Enter a valid phone number (digits only, 9–15 characters).");
        setIsSubmitting(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsSubmitting(false);
        return;
      }

      // Student Registration
      if (role === "Student") {
        console.log("👤 Student Registration Flow");
        // Accept common AASTU student and staff email domains
        const allowedStudentDomains = ["@aastustudent.edu.et", "@aastu.edu.et"];
        if (!allowedStudentDomains.some((d) => email.toLowerCase().endsWith(d))) {
          setError("Only AASTU email addresses are allowed for students.");
          setIsSubmitting(false);
          return;
        }
        if (!studentId) {
          setError("Student ID is required for student registration.");
          setIsSubmitting(false);
          return;
        }
        if (!department) {
          setError("Department is required for student registration.");
          setIsSubmitting(false);
          return;
        }

        console.log("📤 Calling authService.registerStudent()");
        const result = await authService.registerStudent({
          email: email.toLowerCase(),
          username: fullName,
          phone,
          student_id: studentId,
          department,
          password,
        });

        console.log("✅ Response received:", result);

        if (result.success) {
          console.log("🎉 Registration successful!");
          toast.success("Registration successful! Redirecting to dashboard...");
          setTimeout(() => navigate("/login"), 1500);
          return;
        } else {
          console.error("❌ Registration failed:", result.error);
          setError(result.error?.detail || result.error?.email?.[0] || result.error?.student_id?.[0] || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Company Registration
      if (role === "Company") {
        console.log("🏢 Company Registration Flow");
        if (!companyName) {
          setError("Company name is required for company registration.");
          setIsSubmitting(false);
          return;
        }
        const tinRegex = /^\d{10}$/;
        if (!tinRegex.test(String(tinNumber || "").trim())) {
          setError("Please enter a valid 10-digit TIN number.");
          setIsSubmitting(false);
          return;
        }

        console.log("📤 Calling authService.registerCompany()");
        const result = await authService.registerCompany({
          company_name: companyName,
          email: email.toLowerCase(),
          phone,
          username: fullName,
          tin_number: tinNumber,
          password,
        });

        console.log("✅ Response received:", result);

        if (result.success) {
          console.log("🎉 Registration successful!");
          toast.success("Registration successful! Redirecting to dashboard...");
          setTimeout(() => navigate("/login"), 1500);
          return;
        } else {
          console.error("❌ Registration failed:", result.error);
          setError(result.error?.detail || result.error?.email?.[0] || result.error?.tin_number?.[0] || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Staff Registration (Coordinator, Advisor, Examiner)
      if (staffRoles.includes(role)) {
        console.log("👔 Staff Registration Flow -", role);
        if (!email) {
          setError("Email is required for registration.");
          setIsSubmitting(false);
          return;
        }
        if (!department) {
          setError("Department is required for registration.");
          setIsSubmitting(false);
          return;
        }

        console.log("� Calling authService.registerStaff() (OTP skipped in dev mode)");
        const result = await authService.registerStaff({
          email: email.toLowerCase(),
          username: fullName,
          phone,
          department,
          role: role.toLowerCase(),
          password,
        });

        console.log("✅ Staff registration response:", result);

        if (result.success) {
          console.log("🎉 Staff registration successful!");
          toast.success("Registration successful! Redirecting to dashboard...");
          setTimeout(() => navigate("/login"), 1500);
          return;
        } else {
          console.error("❌ Staff registration failed:", result.error);
          setError(result.error?.detail || result.error?.email?.[0] || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
        
        /* 🔴 OTP FLOW COMMENTED OUT (dev mode skips OTP)
        console.log("📝 Showing OTP modal for email:", email);

        // Prepare user data for OTP flow
        const temp = {
          role,
          full_name: fullName,
          email: email.toLowerCase(),
          department,
          phone,
          password,
          tin_number: tinNumber,
        };
        setPendingUser(temp);
        setOtpSent(true);
        setIsSubmitting(false);
        return;
        */
      }
    } catch (err) {
      console.error("💥 Catch error:", err);
      setError("An error occurred during registration. Please try again.");
      console.error("Registration error:", err);
      setIsSubmitting(false);
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

        {/* 🔴 OTP MODAL COMMENTED OUT (dev mode skips OTP verification) */}
        {/* 
        {otpSent && pendingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
            <div className="app-modal-panel w-full max-w-md p-6">
              <h3 className="mb-2 text-lg font-bold text-slate-900">Verify Email</h3>
              <p className="mb-4 text-sm text-slate-600">
                A one-time code was sent to {pendingUser.email}. Check your inbox.
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                className="app-input mb-4"
                disabled={isSubmitting}
              />
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { 
                    setOtpSent(false);
                    setPendingUser(null);
                    setOtpCode("");
                    setError("");
                  }}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    console.log("🔵 Verify OTP button clicked");
                    console.log("📝 OTP Code entered:", otpCode);
                    console.log("📝 Pending user:", pendingUser);

                    if (!otpCode.trim()) {
                      console.log("❌ OTP code is empty");
                      setError("Please enter the OTP code.");
                      return;
                    }

                    console.log("✅ OTP code valid, starting verification process");
                    setIsSubmitting(true);
                    setError("");

                    console.log("📤 Calling authService.verifyOTP()");
                    const result = await authService.verifyOTP(
                      pendingUser.email,
                      otpCode
                    );

                    console.log("✅ OTP verification response:", result);

                    if (result.success) {
                      console.log("🎉 OTP verified successfully!");
                      toast.success("Email verified! Registering your account...");
                      
                      // Now register the staff member
                      console.log("📤 Calling authService.registerStaff()");
                      const registerResult = await authService.registerStaff({
                        email: pendingUser.email,
                        full_name: pendingUser.full_name,
                        phone: pendingUser.phone,
                        department: pendingUser.department,
                        role: pendingUser.role.toLowerCase(),
                        password: pendingUser.password,
                      });

                      console.log("✅ Staff registration response:", registerResult);

                      if (registerResult.success) {
                        console.log("🎉 Staff registration successful!");
                        toast.success("Registration complete! Redirecting to login...");
                        setTimeout(() => {
                          setOtpSent(false);
                          setPendingUser(null);
                          setOtpCode("");
                          navigate("/login");
                        }, 1500);
                      } else {
                        console.error("❌ Staff registration failed:", registerResult.error);
                        setError(registerResult.error?.detail || "Registration failed. Please try again.");
                        setIsSubmitting(false);
                      }
                    } else {
                      console.error("❌ OTP verification failed:", result.error);
                      setError(result.error?.detail || "Invalid OTP. Please try again.");
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </div>
        )}
        */}

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
