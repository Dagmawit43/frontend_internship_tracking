import React, { useState } from "react";
import { Button } from "../../components/ui/Button";

const Register = () => {
  const [form, setForm] = useState({
    company_name: "",
    representative_name: "",
    representative_email: "",
    phone: "",
    tin_number: "",
    location: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    localStorage.setItem("companyRegistration", JSON.stringify(form));
  };

  if (submitted) {
    return (
      <div className="app-shell flex items-center justify-center p-6">
        <div className="app-auth-card max-w-lg w-full space-y-3 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Registration Submitted
          </h2>
          <p className="text-slate-600">Your company is pending verification.</p>
          <p className="text-sm text-slate-500">
            We will notify you once verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="app-auth-card max-w-3xl w-full space-y-6 p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Company Registration
          </h1>
          <p className="text-sm text-slate-600">
            Submit your company for verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Representative Name
            </label>
            <input
              name="representative_name"
              value={form.representative_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Representative Email
            </label>
            <input
              type="email"
              name="representative_email"
              value={form.representative_email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              TIN Number
            </label>
            <input
              name="tin_number"
              value={form.tin_number}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter 10-digit TIN"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Submit Registration</Button>
        </div>
      </form>
    </div>
  );
};

export default Register;
