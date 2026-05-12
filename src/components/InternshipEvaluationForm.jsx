import React, { useState, useEffect } from "react";
import { Lock, CheckCircle } from "lucide-react";

const EMPTY_FORM = {
  // Section A: Professional Competence (30 points)
  sectionA: [0, 0, 0, 0, 0, 0], // 6 items, 5 points each
  // Section B: Personal Attributes (30 points)
  sectionB: [0, 0, 0, 0, 0, 0], // 6 items, 5 points each
  additionalComment: "",
  supervisorSignatureName: "",
};

const SECTION_A_LABELS = [
  "Technical Skills and Knowledge",
  "Problem-Solving Ability",
  "Quality of Work",
  "Initiative and Creativity",
  "Adaptability to New Tasks",
  "Project Management Skills",
];

const SECTION_B_LABELS = [
  "Punctuality and Attendance",
  "Professionalism and Ethics",
  "Communication Skills",
  "Teamwork and Collaboration",
  "Leadership Potential",
  "Overall Attitude and Motivation",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ title, points }) => (
  <h2 className="text-xl font-bold text-blue-700 mb-4 mt-6 border-b border-blue-100 pb-2">
    {title} <span className="text-sm text-gray-500">({points} points)</span>
  </h2>
);

const ScoreField = ({ label, value, onChange, index, section, readOnly }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => !readOnly && onChange(section, index, score)}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-bold transition-all ${
            value === score
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          } ${readOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          disabled={readOnly}
        >
          {score}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Props:
 *  - initialData   : object  — pre-fill fields
 *  - readOnly      : bool    — lock all inputs
 *  - onSubmit      : (formData) => void  — called when company submits
 *  - advisorView   : bool    — show advisor approve/reject panel
 *  - examinerView  : bool    — show examiner approve/reject panel
 *  - advisorComment: string  — existing advisor comment
 *  - examinerComment: string — existing examiner comment
 *  - onAdvisorAction: ({ action: "approve"|"reject", comment }) => void
 *  - onExaminerAction: ({ action: "approve"|"reject", comment }) => void
 */
const InternshipEvaluationForm = ({
  initialData = {},
  readOnly = false,
  onSubmit,
  advisorView = false,
  examinerView = false,
  advisorComment: existingAdvisorComment = "",
  examinerComment: existingExaminerComment = "",
  onAdvisorAction,
  onExaminerAction,
}) => {
  const [formData, setFormData] = useState({ ...EMPTY_FORM, ...initialData });
  const [advisorComment, setAdvisorComment] = useState(existingAdvisorComment);
  const [examinerComment, setExaminerComment] = useState(existingExaminerComment);

  // Sync if parent passes new initialData
  useEffect(() => {
    setFormData({ ...EMPTY_FORM, ...initialData });
    setAdvisorComment(existingAdvisorComment);
    setExaminerComment(existingExaminerComment);
  }, [initialData, existingAdvisorComment, existingExaminerComment]);

  const handleScoreChange = (section, index, score) => {
    if (readOnly) return;
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((val, i) => (i === index ? score : val)),
    }));
  };

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalA = formData.sectionA.reduce((a, b) => a + b, 0);
  const totalB = formData.sectionB.reduce((a, b) => a + b, 0);
  const total = totalA + totalB; // out of 60
  const finalMark = ((total / 60) * 20).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ ...formData, total, finalMark: Number(finalMark) });
  };

  return (
    <div className="bg-white rounded-xl">
      {readOnly && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400" />
          This evaluation is locked and read-only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Final Internship Supervisor Evaluation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Addis Ababa Science and Technology University
          </p>
        </div>

        {/* Section A: Professional Competence */}
        <SectionTitle title="Professional Competence" points="30" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {SECTION_A_LABELS.map((label, index) => (
            <ScoreField
              key={`a-${index}`}
              label={label}
              value={formData.sectionA[index]}
              onChange={handleScoreChange}
              index={index}
              section="sectionA"
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Section B: Personal Attributes */}
        <SectionTitle title="Personal Attributes" points="30" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {SECTION_B_LABELS.map((label, index) => (
            <ScoreField
              key={`b-${index}`}
              label={label}
              value={formData.sectionB[index]}
              onChange={handleScoreChange}
              index={index}
              section="sectionB"
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Results Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 my-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-1">Section A (Professional)</p>
              <p className="text-2xl font-bold text-blue-700">{totalA} / 30</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-1">Section B (Personal)</p>
              <p className="text-2xl font-bold text-blue-700">{totalB} / 30</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-base font-bold text-gray-800">Total Score</p>
                <p className="text-sm text-gray-600">Sum of all sections</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{total} / 60</p>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-base font-bold text-gray-800">Final Internship Mark</p>
                <p className="text-sm text-gray-600">Converted to 20-point scale</p>
              </div>
              <p className="text-3xl font-black text-green-700">{finalMark} / 20</p>
            </div>
          </div>
        </div>

        {/* Additional Comment */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Comment</label>
          <textarea
            name="additionalComment"
            value={formData.additionalComment}
            onChange={handleChange}
            readOnly={readOnly}
            rows={4}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              readOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white"
            }`}
            placeholder="Write additional comments about the intern's overall performance..."
          />
        </div>

        {/* Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Company Supervisor Name (Signature)
            </label>
            <input
              type="text"
              name="supervisorSignatureName"
              value={formData.supervisorSignatureName}
              onChange={handleChange}
              readOnly={readOnly}
              className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                readOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white"
              }`}
            />
          </div>
        </div>

        {/* Advisor comment (read-only display for company/examiner view) */}
        {existingAdvisorComment && !advisorView && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Advisor Comment</p>
            <p className="text-sm text-gray-700">{existingAdvisorComment}</p>
          </div>
        )}

        {/* Examiner comment (read-only display for company/advisor view) */}
        {existingExaminerComment && !examinerView && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Examiner Comment</p>
            <p className="text-sm text-gray-700">{existingExaminerComment}</p>
          </div>
        )}

        {/* ── Company submit button ── */}
        {!readOnly && !advisorView && !examinerView && onSubmit && (
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-colors"
            >
              Submit Final Evaluation
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
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a comment for the company or examiner..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onAdvisorAction({ action: "approve", comment: advisorComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Send to Examiner
              </button>
              <button
                type="button"
                onClick={() => onAdvisorAction({ action: "reject", comment: advisorComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
              >
                Reject — Return to Company
              </button>
            </div>
          </div>
        )}

        {/* ── Examiner approve / reject panel ── */}
        {examinerView && onExaminerAction && (
          <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Examiner Decision</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Examiner Comment (optional)
              </label>
              <textarea
                value={examinerComment}
                onChange={(e) => setExaminerComment(e.target.value)}
                rows={3}
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a comment for the record..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onExaminerAction({ action: "approve", comment: examinerComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Record Permanently
              </button>
              <button
                type="button"
                onClick={() => onExaminerAction({ action: "reject", comment: examinerComment })}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
              >
                Reject — Return to Advisor
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default InternshipEvaluationForm;