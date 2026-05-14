import React, { useState, useEffect } from "react";
import { Lock, CheckCircle } from "lucide-react";

const LEN_A = 5;
const LEN_B = 7;

const emptyForm = () => ({
  studentName: "",
  idNo: "",
  department: "",
  organization: "",
  duration: "",
  sectionA: Array(LEN_A).fill(0),
  sectionB: Array(LEN_B).fill(0),
  comments: "",
  jobOffer: "",
  supervisorName: "",
  position: "",
});

/** Merge stored / legacy (6+6) shapes into the current 5+7 form. */
const normalizeInitial = (initialData) => {
  const base = emptyForm();
  if (!initialData || typeof initialData !== "object") return base;

  let sectionA = Array.isArray(initialData.sectionA) ? [...initialData.sectionA] : [...base.sectionA];
  let sectionB = Array.isArray(initialData.sectionB) ? [...initialData.sectionB] : [...base.sectionB];
  while (sectionA.length < LEN_A) sectionA.push(0);
  sectionA = sectionA.slice(0, LEN_A);
  while (sectionB.length < LEN_B) sectionB.push(0);
  sectionB = sectionB.slice(0, LEN_B);

  return {
    ...base,
    ...initialData,
    studentName: initialData.studentName ?? "",
    idNo: initialData.idNo ?? initialData.studentId ?? "",
    department: initialData.department ?? "",
    organization: initialData.organization ?? initialData.companyName ?? "",
    duration: initialData.duration ?? "",
    sectionA,
    sectionB,
    comments: initialData.comments ?? initialData.additionalComment ?? "",
    jobOffer: initialData.jobOffer ?? "",
    supervisorName:
      initialData.supervisorName ?? initialData.supervisorSignatureName ?? "",
    position: initialData.position ?? "",
  };
};

const SECTION_A_LABELS = [
  "Knowledge about task",
  "Problem solving",
  "Quality of work",
  "Punctuality",
  "Initiative",
];

const SECTION_B_LABELS = [
  "Dedication",
  "Cooperation",
  "Discipline",
  "Responsibility",
  "Socialization",
  "Communication",
  "Decision Making",
];

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
  const [form, setForm] = useState(() => normalizeInitial(initialData));
  const [advisorComment, setAdvisorComment] = useState(existingAdvisorComment);
  const [examinerComment, setExaminerComment] = useState(existingExaminerComment);

  useEffect(() => {
    setForm(normalizeInitial(initialData));
    setAdvisorComment(existingAdvisorComment);
    setExaminerComment(existingExaminerComment);
  }, [initialData, existingAdvisorComment, existingExaminerComment]);

  const handleRating = (section, index, value) => {
    if (readOnly) return;
    const updated = [...form[section]];
    updated[index] = Number(value);
    setForm({ ...form, [section]: updated });
  };

  const setField = (key, value) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalA = form.sectionA.reduce((a, b) => a + b, 0);
  const totalB = form.sectionB.reduce((a, b) => a + b, 0);
  const total = totalA + totalB;
  const finalMark = ((total / 60) * 20).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ ...form, total, finalMark: Number(finalMark) });
  };

  const inputClass = readOnly
    ? "border border-gray-200 p-2 rounded bg-gray-50 text-gray-600 cursor-not-allowed"
    : "border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none";

  const selectClass = readOnly
    ? "border border-gray-200 rounded p-2 bg-gray-50 cursor-not-allowed"
    : "border border-gray-300 rounded p-2";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-xl">
      {readOnly && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
          This evaluation is locked and read-only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Internship Industry Supervisor Evaluation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <input
            placeholder="Student Name"
            className={inputClass}
            value={form.studentName}
            readOnly={readOnly}
            onChange={(e) => setField("studentName", e.target.value)}
          />
          <input
            placeholder="ID No"
            className={inputClass}
            value={form.idNo}
            readOnly={readOnly}
            onChange={(e) => setField("idNo", e.target.value)}
          />
          <input
            placeholder="Department"
            className={inputClass}
            value={form.department}
            readOnly={readOnly}
            onChange={(e) => setField("department", e.target.value)}
          />
          <input
            placeholder="Organization"
            className={inputClass}
            value={form.organization}
            readOnly={readOnly}
            onChange={(e) => setField("organization", e.target.value)}
          />
          <input
            placeholder="Duration (e.g. June–Aug 2026)"
            className={`${inputClass} sm:col-span-2`}
            value={form.duration}
            readOnly={readOnly}
            onChange={(e) => setField("duration", e.target.value)}
          />
        </div>

        <h3 className="font-semibold mb-2 text-gray-800">
          Section A - Job Performance
        </h3>
        {SECTION_A_LABELS.map((item, i) => (
          <div key={i} className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <label className="text-sm text-gray-700">{item}</label>
            <select
              className={selectClass}
              value={String(form.sectionA[i])}
              disabled={readOnly}
              onChange={(e) => handleRating("sectionA", i, e.target.value)}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2 text-gray-800">
          Section B - Soft Skills
        </h3>
        {SECTION_B_LABELS.map((item, i) => (
          <div key={i} className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <label className="text-sm text-gray-700">{item}</label>
            <select
              className={selectClass}
              value={String(form.sectionB[i])}
              disabled={readOnly}
              onChange={(e) => handleRating("sectionB", i, e.target.value)}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2 text-gray-800">
          Section C - Comments
        </h3>
        <textarea
          className={`border w-full p-2 rounded min-h-[100px] ${readOnly ? "bg-gray-50 cursor-not-allowed" : "border-gray-300"}`}
          placeholder="Supervisor comments..."
          value={form.comments}
          readOnly={readOnly}
          onChange={(e) => setField("comments", e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-700">Job Offer?</label>
          <select
            className={selectClass}
            value={form.jobOffer}
            disabled={readOnly}
            onChange={(e) => setField("jobOffer", e.target.value)}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <input
            placeholder="Supervisor name"
            className={inputClass}
            value={form.supervisorName}
            readOnly={readOnly}
            onChange={(e) => setField("supervisorName", e.target.value)}
          />
          <input
            placeholder="Position / title"
            className={inputClass}
            value={form.position}
            readOnly={readOnly}
            onChange={(e) => setField("position", e.target.value)}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg space-y-1">
          <p className="font-medium text-gray-800">
            Total Score: {total} / 60
          </p>
          <p className="text-green-800 font-semibold">
            Final mark (out of 20): {finalMark}
          </p>
        </div>

        {existingAdvisorComment && !advisorView && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
              Advisor Comment
            </p>
            <p className="text-sm text-gray-700">{existingAdvisorComment}</p>
          </div>
        )}

        {existingExaminerComment && !examinerView && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">
              Examiner Comment
            </p>
            <p className="text-sm text-gray-700">{existingExaminerComment}</p>
          </div>
        )}

        {!readOnly && !advisorView && !examinerView && onSubmit && (
          <div className="mt-6">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-colors"
            >
              Submit Company Final Evaluation
            </button>
          </div>
        )}

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
                placeholder="Add a comment for the company or examiner..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() =>
                  onAdvisorAction({ action: "approve", comment: advisorComment })
                }
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Send to Examiner
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdvisorAction({ action: "reject", comment: advisorComment })
                }
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
              >
                Reject — Return to Company
              </button>
            </div>
          </div>
        )}

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
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a comment for the record..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() =>
                  onExaminerAction({ action: "approve", comment: examinerComment })
                }
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Record Permanently
              </button>
              <button
                type="button"
                onClick={() =>
                  onExaminerAction({ action: "reject", comment: examinerComment })
                }
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
