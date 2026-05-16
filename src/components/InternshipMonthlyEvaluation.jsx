import React, { useState, useEffect } from "react";
import { CheckCircle, Lock } from "lucide-react";

const SCORE_FIELDS = [
  "punctuality",
  "reliability",
  "independence",
  "communication",
  "professionalism",
  "speedOfWork",
  "accuracy",
  "engagement",
  "workNeed",
  "cooperation",
  "technicalSkills",
  "organizationalSkills",
  "projectSupport",
  "responsibility",
  "teamwork",
];

const EMPTY_FORM = {
  month: "",
  companyName: "",
  supervisorName: "",
  phoneNo: "",
  studentName: "",
  studentId: "",
  department: "",
  punctuality: "",
  reliability: "",
  independence: "",
  communication: "",
  professionalism: "",
  speedOfWork: "",
  accuracy: "",
  engagement: "",
  workNeed: "",
  cooperation: "",
  technicalSkills: "",
  organizationalSkills: "",
  projectSupport: "",
  responsibility: "",
  teamwork: "",
  additionalComment: "",
  supervisorSignatureName: "",
};

const calculateTotal = (data) =>
  SCORE_FIELDS.reduce((sum, key) => sum + Number(data[key] || 0), 0);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ title }) => (
  <h2 className="text-xl font-bold text-indigo-700 mb-4 mt-6 border-b border-indigo-100 pb-2">
    {title}
  </h2>
);

const InputField = ({ label, name, value, onChange, readOnly }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        readOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white"
      }`}
    />
  </div>
);

const ScoreField = ({ label, name, value, onChange, readOnly }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      min="0"
      max="20"
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        readOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white"
      }`}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Props:
 *  - initialData   : object  — pre-fill fields (studentName, studentId, companyName, department, month, …)
 *  - readOnly      : bool    — lock all inputs (submitted / approved state)
 *  - onSubmit      : (formData) => void  — called when company submits
 *  - advisorView   : bool    — show advisor approve/reject panel instead of submit button
 *  - advisorComment: string  — existing advisor comment to display
 *  - onAdvisorAction: ({ action: "approve"|"reject", comment }) => void
 */
const InternshipMonthlyEvaluation = ({
  initialData = {},
  readOnly = false,
  onSubmit,
  advisorView = false,
  advisorComment: existingAdvisorComment = "",
  onAdvisorAction,
}) => {
  const fieldsLocked = readOnly || advisorView;
  const [formData, setFormData] = useState({ ...EMPTY_FORM, ...initialData });
  const [advisorComment, setAdvisorComment] = useState(existingAdvisorComment);
  const [errors, setErrors] = useState({});

  // Sync if parent passes new initialData (e.g. switching between Month 1 / Month 2)
  useEffect(() => {
    setFormData({ ...EMPTY_FORM, ...initialData });
    setAdvisorComment(existingAdvisorComment);
  }, [initialData, existingAdvisorComment]);

  const handleChange = (e) => {
    if (fieldsLocked) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const totalMarks = calculateTotal(formData);
  const monthlyPerformance = ((totalMarks / 100) * 20).toFixed(2);

  const validate = () => {
    const newErrors = {};
    SCORE_FIELDS.forEach((key) => {
      const v = Number(formData[key]);
      if (formData[key] === "" || isNaN(v) || v < 0 || v > 20) {
        newErrors[key] = true;
      }
    });
    if (!formData.supervisorName.trim()) newErrors.supervisorName = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit?.({ ...formData, totalMarks, monthlyPerformance: Number(monthlyPerformance) });
  };

  return (
    <div className="bg-white rounded-xl">
      {fieldsLocked && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400" />
          This evaluation is locked and read-only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Internship Industry Supervisor Monthly Performance Evaluation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Addis Ababa Science and Technology University
          </p>
        </div>

        {/* Basic Information */}
        <SectionTitle title="Basic Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <InputField label="Month" name="month" value={formData.month} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Supervisor Name" name="supervisorName" value={formData.supervisorName} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Student Full Name" name="studentName" value={formData.studentName} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} readOnly={fieldsLocked} />
          <InputField label="Department" name="department" value={formData.department} onChange={handleChange} readOnly={fieldsLocked} />
        </div>

        {/* General Performance */}
        <SectionTitle title="General Performance (25%)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {[
            { label: "Punctuality (5%)", name: "punctuality" },
            { label: "Reliability (5%)", name: "reliability" },
            { label: "Independence In Work (5%)", name: "independence" },
            { label: "Communication Skills (5%)", name: "communication" },
            { label: "Professionalism (5%)", name: "professionalism" },
          ].map(({ label, name }) => (
            <div key={name}>
              <ScoreField label={label} name={name} value={formData[name]} onChange={handleChange} readOnly={fieldsLocked} />
              {errors[name] && <p className="text-xs text-red-500 mt-1">Enter a value between 0–20</p>}
            </div>
          ))}
        </div>

        {/* Personal Skills */}
        <SectionTitle title="Personal Skills (25%)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {[
            { label: "Speed of Work (5%)", name: "speedOfWork" },
            { label: "Accuracy (5%)", name: "accuracy" },
            { label: "Engagement (5%)", name: "engagement" },
            { label: "Do you need him/her for your work (5%)", name: "workNeed" },
            { label: "Cooperation with colleagues (5%)", name: "cooperation" },
          ].map(({ label, name }) => (
            <div key={name}>
              <ScoreField label={label} name={name} value={formData[name]} onChange={handleChange} readOnly={fieldsLocked} />
              {errors[name] && <p className="text-xs text-red-500 mt-1">Enter a value between 0–20</p>}
            </div>
          ))}
        </div>

        {/* Professional Skills */}
        <SectionTitle title="Professional Skills (50%)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {[
            { label: "Technical Skills (5%)", name: "technicalSkills" },
            { label: "Organizational Skills (5%)", name: "organizationalSkills" },
            { label: "Support of Project Tasks (5%)", name: "projectSupport" },
            { label: "Responsibility in Task Fulfillment (15%)", name: "responsibility" },
            { label: "Quality as a Team Member (20%)", name: "teamwork" },
          ].map(({ label, name }) => (
            <div key={name}>
              <ScoreField label={label} name={name} value={formData[name]} onChange={handleChange} readOnly={fieldsLocked} />
              {errors[name] && <p className="text-xs text-red-500 mt-1">Enter a value between 0–20</p>}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 my-6">
          <div className="flex justify-between items-center mb-3 text-base font-bold text-gray-800">
            <span>Total Marks (out of 100)</span>
            <span className="text-2xl text-indigo-700">{totalMarks}</span>
          </div>
          <div className="flex justify-between items-center text-base font-bold text-gray-800">
            <span>Monthly Performance Mark (out of 20)</span>
            <span className="text-2xl text-green-700">{monthlyPerformance}</span>
          </div>
        </div>

        {/* Additional Comment */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Comment</label>
          <textarea
            name="additionalComment"
            value={formData.additionalComment}
            onChange={handleChange}
            readOnly={fieldsLocked}
            rows={4}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              fieldsLocked ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white"
            }`}
            placeholder="Write additional comments here..."
          />
        </div>

        {/* Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Company Supervisor Name (Signature)"
            name="supervisorSignatureName"
            value={formData.supervisorSignatureName}
            onChange={handleChange}
            readOnly={fieldsLocked}
          />
        </div>

        {/* Advisor comment (read-only display for company view) */}
        {existingAdvisorComment && !advisorView && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Advisor Comment</p>
            <p className="text-sm text-gray-700">{existingAdvisorComment}</p>
          </div>
        )}

        {/* ── Company submit button ── */}
        {!fieldsLocked && onSubmit && (
          <div className="mt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-colors"
            >
              Submit Evaluation
            </button>
          </div>
        )}

        {/* ── Advisor approve / reject panel ── */}
        {advisorView && onAdvisorAction && (
          <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Advisor Decision</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Advisor Comment (optional)
              </label>
              <textarea
                value={advisorComment}
                onChange={(e) => setAdvisorComment(e.target.value)}
                rows={3}
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a comment for the company or student..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onAdvisorAction({ action: "approve", comment: advisorComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Evaluation
              </button>
              <button
                type="button"
                onClick={() => onAdvisorAction({ action: "reject", comment: advisorComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
              >
                Reject — Send Back
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default InternshipMonthlyEvaluation;
