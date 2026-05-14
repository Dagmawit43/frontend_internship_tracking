import React, { useState } from "react";
import { X, Upload, FileText } from "lucide-react";

const ApplicationModal = ({ company, studentId, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: "",
    additionalDocument: null,
    documentName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
          additionalDocument: event.target.result,
          documentName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert("Please provide a reason for choosing this company");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        studentId,
        companyId: company.id,
        companyName: company.companyName,
      });
      setFormData({ reason: "", additionalDocument: null, documentName: "" });
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="app-modal-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Apply to {company.companyName || company.company_name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Details */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4">
            <h3 className="mb-2 font-semibold text-slate-900">Company Information</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-medium">Name:</span> {company.companyName}
              </p>
              {company.location && (
                <p>
                  <span className="font-medium">Location:</span> {company.location}
                </p>
              )}
              {company.contactEmail && (
                <p>
                  <span className="font-medium">Email:</span> {company.contactEmail}
                </p>
              )}
            </div>
          </div>

          {/* Student ID */}
          <div>
            <label className="app-field-label">
              Student ID
            </label>
            <input
              type="text"
              value={studentId || ""}
              disabled
              className="app-input cursor-not-allowed bg-slate-100 text-slate-600"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="app-field-label">
              Reason for Choosing This Company <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={5}
              className="app-input min-h-[120px] resize-y py-3"
              placeholder="Explain why you want to intern at this company..."
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="app-field-label">
              Upload CV/Resume <span className="text-red-500">*</span>
            </label>
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-4">
              <input
                type="file"
                id="document-upload"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <label
                htmlFor="document-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                {formData.documentName ? (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>{formData.documentName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-blue-700/10 bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;




















