import React, { useState } from "react";
import { Upload, FileText, MapPin, Building2, User, Mail, Phone } from "lucide-react";

const SelfPlacementSection = ({ studentId, onSubmit }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    representativeName: "",
    representativeEmail: "",
    representativePhone: "",
    location: "",
    companyLicense: null,
    licenseFileName: "",
    additionalNotes: "",
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          companyLicense: event.target.result,
          licenseFileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.representativeEmail || !formData.companyLicense) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const selfPlacementData = {
        id: Date.now(),
        studentId,
        ...formData,
        status: "Pending Verification",
        submittedAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem("selfPlacements")) || [];
      existing.push(selfPlacementData);
      localStorage.setItem("selfPlacements", JSON.stringify(existing));

      setStatus("Pending Verification");
      setFormData({
        companyName: "",
        representativeName: "",
        representativeEmail: "",
        representativePhone: "",
        location: "",
        companyLicense: null,
        licenseFileName: "",
        additionalNotes: "",
      });
      setIsFormOpen(false);
      
      if (onSubmit) onSubmit(selfPlacementData);
    } catch (error) {
      console.error("Error submitting self-placement:", error);
      alert("Error submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load existing status
  React.useEffect(() => {
    const selfPlacements = JSON.parse(localStorage.getItem("selfPlacements")) || [];
    const studentPlacement = selfPlacements.find((sp) => sp.studentId === studentId);
    if (studentPlacement) {
      setStatus(studentPlacement.status);
    }
  }, [studentId]);

  const getStatusColor = (status) => {
    const statusMap = {
      "Pending Verification": "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Self-Placement Request
          </h3>
          <p className="text-sm text-gray-600">
            Submit a company for internship placement verification
          </p>
        </div>
        {status && (
          <div
            className={`px-4 py-2 rounded-lg border font-medium text-sm ${getStatusColor(
              status
            )}`}
          >
            {status}
          </div>
        )}
      </div>

      {!status ? (
        <>
          {!isFormOpen ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Upload className="w-5 h-5" />
              Submit Self-Placement Request
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              {/* Representative Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Representative Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Representative Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="representativeEmail"
                      value={formData.representativeEmail}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representative Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="representativePhone"
                    value={formData.representativePhone}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* License Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company License <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id="license-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="license-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {formData.licenseFileName ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>{formData.licenseFileName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload company license
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, JPG, PNG (Max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any additional information about the company..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({
                      companyName: "",
                      representativeName: "",
                      representativeEmail: "",
                      representativePhone: "",
                      location: "",
                      companyLicense: null,
                      licenseFileName: "",
                      additionalNotes: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Your self-placement request status: <span className="font-semibold">{status}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SelfPlacementSection;




