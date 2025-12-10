import React, { useState } from "react";
import { Button } from "../../components/ui/Button";

const Register = () => {
  const [form, setForm] = useState({
    company_name: "",
    representative_name: "",
    representative_email: "",
    phone: "",
    license_number: "",
    location: "",
    registration_document: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, registration_document: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    localStorage.setItem("companyRegistration", JSON.stringify(form));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-8 max-w-lg w-full text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Registration Submitted</h2>
          <p className="text-gray-600">Your company is pending verification.</p>
          <p className="text-sm text-gray-500">We will notify you once verified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-md p-8 max-w-3xl w-full space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Registration</h1>
          <p className="text-gray-600 text-sm">Submit your company for verification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Company Name</label>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Representative Name</label>
            <input
              name="representative_name"
              value={form.representative_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Representative Email</label>
            <input
              type="email"
              name="representative_email"
              value={form.representative_email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">License Number</label>
            <input
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Registration Document (UI only)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="w-full" />
          {form.registration_document && (
            <p className="text-xs text-gray-500">Document uploaded</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">Submit Registration</Button>
        </div>
      </form>
    </div>
  );
};

export default Register;


