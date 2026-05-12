import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

const EMPTY = {
  studentName: "",
  studentId: "",
  department: "",
  companyName: "",
  internshipTitle: "",
  academicProgress: "0",
  integrationAtCompany: "0",
  communication: "0",
  professionalism: "0",
  overallProgress: "0",
  strengths: "",
  areasForImprovement: "",
  recommendations: "",
  advisorSignature: "",
};

const RATING_KEYS = [
  { key: "academicProgress", label: "Academic progress & learning outcomes" },
  { key: "integrationAtCompany", label: "Integration at the host organization" },
  { key: "communication", label: "Communication & reporting" },
  { key: "professionalism", label: "Professionalism & ethics" },
  { key: "overallProgress", label: "Overall internship progress" },
];

const selectClass = (readOnly) =>
  readOnly
    ? "border border-gray-200 rounded-lg p-2 text-sm bg-gray-50 cursor-not-allowed"
    : "border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none";

/**
 * Academic advisor internship evaluation (advisor-authored).
 * @param {object} initialData - prefill (merged with EMPTY)
 * @param {boolean} readOnly - after submit
 * @param {function} onSubmit - (formPayload) => void
 */
const AdvisorStudentEvaluationForm = ({
  initialData = {},
  readOnly = false,
  onSubmit,
}) => {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });

  useEffect(() => {
    setForm({ ...EMPTY, ...initialData });
  }, [initialData]);

  const setField = (key, value) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalRating = RATING_KEYS.reduce(
    (sum, { key }) => sum + Number(form[key] || 0),
    0
  );
  const maxRating = RATING_KEYS.length * 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    onSubmit({ ...form, totalRating, maxRating });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      {readOnly && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
          Submitted evaluation — read only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-bold text-blue-700 mb-1 border-b border-blue-100 pb-2">
          Academic Advisor — Internship Evaluation
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Addis Ababa Science and Technology University · Supervisor assessment of student performance during placement
        </p>

        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Student & placement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <input
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-700"
            value={form.studentName}
            readOnly
            placeholder="Student name"
          />
          <input
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-700"
            value={form.studentId}
            readOnly
            placeholder="ID"
          />
          <input
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-700"
            value={form.department}
            readOnly
            placeholder="Department"
          />
          <input
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-700"
            value={form.companyName}
            readOnly
            placeholder="Organization"
          />
          <input
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-gray-700 sm:col-span-2"
            value={form.internshipTitle}
            readOnly
            placeholder="Internship title"
          />
        </div>

        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
          Performance (0–5 each)
        </h3>
        <div className="space-y-3 mb-6">
          {RATING_KEYS.map(({ key, label }) => (
            <div
              key={key}
              className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-2"
            >
              <label className="text-sm text-gray-800 font-medium">{label}</label>
              <select
                className={selectClass(readOnly)}
                value={String(form[key] ?? "0")}
                disabled={readOnly}
                onChange={(e) => setField(key, e.target.value)}
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm font-semibold text-gray-800">
            Rating total: {totalRating} / {maxRating}
          </p>
        </div>

        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-2">Narrative</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Strengths observed</label>
            <textarea
              className={`w-full border rounded-lg p-2 text-sm min-h-[80px] ${readOnly ? "bg-gray-50 border-gray-200" : "border-gray-300"}`}
              value={form.strengths}
              readOnly={readOnly}
              onChange={(e) => setField("strengths", e.target.value)}
              placeholder="Describe strengths…"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Areas for improvement</label>
            <textarea
              className={`w-full border rounded-lg p-2 text-sm min-h-[80px] ${readOnly ? "bg-gray-50 border-gray-200" : "border-gray-300"}`}
              value={form.areasForImprovement}
              readOnly={readOnly}
              onChange={(e) => setField("areasForImprovement", e.target.value)}
              placeholder="Optional constructive feedback…"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Recommendations</label>
            <textarea
              className={`w-full border rounded-lg p-2 text-sm min-h-[80px] ${readOnly ? "bg-gray-50 border-gray-200" : "border-gray-300"}`}
              value={form.recommendations}
              readOnly={readOnly}
              onChange={(e) => setField("recommendations", e.target.value)}
              placeholder="Next steps, coursework, or follow-up…"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Advisor name (signature)</label>
          <input
            type="text"
            className={`w-full border rounded-lg p-2 text-sm max-w-md ${readOnly ? "bg-gray-50 border-gray-200" : "border-gray-300"}`}
            value={form.advisorSignature}
            readOnly={readOnly}
            onChange={(e) => setField("advisorSignature", e.target.value)}
            placeholder="Printed name"
          />
        </div>

        {!readOnly && onSubmit && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-sm"
            >
              Submit evaluation to student
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdvisorStudentEvaluationForm;
