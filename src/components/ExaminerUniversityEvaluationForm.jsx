import React, { useState, useEffect, useMemo } from "react";
import { Lock } from "lucide-react";

export const EXAMINER_UNIV_REPORT_ITEMS = [
  { title: "Format", weight: 4 },
  { title: "Organization Background", weight: 4 },
  { title: "Activities", weight: 6 },
  { title: "Usage of Data/Figure/Table", weight: 8 },
  { title: "Report Content", weight: 10 },
  { title: "Recommendation", weight: 4 },
  { title: "Conclusion", weight: 4 },
];

export const EXAMINER_UNIV_PRESENTATION_ITEMS = [
  { title: "Format", weight: 5 },
  { title: "Appearance", weight: 5 },
  { title: "Clarity", weight: 5 },
  { title: "Time", weight: 5 },
  { title: "Understanding", weight: 10 },
  { title: "Q & A Session", weight: 10 },
];

const zeroScores = (n) => Array(n).fill(0);

const normalizeScores = (arr, len) => {
  if (!Array.isArray(arr) || arr.length !== len) return zeroScores(len);
  return arr.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
};

const emptyForm = () => ({
  studentName: "",
  idNo: "",
  department: "",
  organization: "",
  examinerName: "",
  reportScores: zeroScores(EXAMINER_UNIV_REPORT_ITEMS.length),
  presentationScores: zeroScores(EXAMINER_UNIV_PRESENTATION_ITEMS.length),
});

/**
 * Internship University Examiner Evaluation Form (Report + Presentation → /25).
 */
const ExaminerUniversityEvaluationForm = ({
  initialData = {},
  readOnly = false,
  onSubmit,
}) => {
  const merged = useMemo(() => {
    const base = emptyForm();
    const raw = { ...base, ...initialData };
    raw.idNo = initialData.idNo ?? initialData.studentId ?? raw.idNo ?? "";
    raw.organization =
      initialData.organization ?? initialData.companyName ?? raw.organization ?? "";
    raw.examinerName =
      initialData.examinerName ?? initialData.examinerDisplayName ?? raw.examinerName ?? "";
    raw.reportScores = normalizeScores(
      initialData.reportScores,
      EXAMINER_UNIV_REPORT_ITEMS.length
    );
    raw.presentationScores = normalizeScores(
      initialData.presentationScores,
      EXAMINER_UNIV_PRESENTATION_ITEMS.length
    );
    return raw;
  }, [initialData]);

  const [form, setForm] = useState(merged);

  useEffect(() => {
    setForm(merged);
  }, [merged]);

  const handleScoreChange = (section, index, value) => {
    if (readOnly) return;
    const updated = [...form[section]];
    updated[index] = Number(value);
    setForm({ ...form, [section]: updated });
  };

  const setExaminerName = (value) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, examinerName: value }));
  };

  const reportTotal = form.reportScores.reduce((sum, val) => sum + val, 0);
  const presentationTotal = form.presentationScores.reduce((sum, val) => sum + val, 0);
  const reportFinal = (reportTotal / 40) * 15;
  const presentationFinal = (presentationTotal / 40) * 10;
  const finalMark = (reportFinal + presentationFinal).toFixed(2);

  const selectClass = readOnly
    ? "border border-gray-200 rounded p-1 text-sm bg-gray-50 cursor-not-allowed min-w-[3.5rem]"
    : "border border-gray-300 rounded p-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[3.5rem]";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    onSubmit({
      ...form,
      reportScores: [...form.reportScores],
      presentationScores: [...form.presentationScores],
      reportTotal,
      presentationTotal,
      reportFinal: Number(reportFinal.toFixed(2)),
      presentationFinal: Number(presentationFinal.toFixed(2)),
      finalMark: Number(finalMark),
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow rounded-xl border border-gray-200">
      {readOnly && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
          Submitted evaluation — read only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Internship University Examiner Evaluation Form
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <input
            placeholder="Student Name"
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            value={form.studentName}
            readOnly
          />
          <input
            placeholder="ID No"
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            value={form.idNo}
            readOnly
          />
          <input
            placeholder="Department"
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            value={form.department}
            readOnly
          />
          <input
            placeholder="Organization"
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            value={form.organization}
            readOnly
          />
          <input
            placeholder="Examiner name"
            className="border border-gray-200 rounded p-2 text-sm sm:col-span-2 bg-white"
            value={form.examinerName}
            readOnly={readOnly}
            onChange={(e) => setExaminerName(e.target.value)}
          />
        </div>

        <h2 className="font-bold text-lg mb-3 text-gray-900">1. Report (15%)</h2>

        {EXAMINER_UNIV_REPORT_ITEMS.map((item, i) => (
          <div
            key={`r-${item.title}`}
            className="flex flex-wrap justify-between items-center gap-2 mb-2 border border-gray-200 rounded p-2 bg-gray-50/50"
          >
            <span className="text-sm text-gray-800">
              {item.title} (Max {item.weight})
            </span>
            <select
              className={selectClass}
              value={form.reportScores[i]}
              disabled={readOnly}
              onChange={(e) => handleScoreChange("reportScores", i, e.target.value)}
            >
              {Array.from({ length: item.weight + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}

        <h2 className="font-bold text-lg mt-6 mb-3 text-gray-900">2. Presentation (10%)</h2>

        {EXAMINER_UNIV_PRESENTATION_ITEMS.map((item, i) => (
          <div
            key={`p-${item.title}`}
            className="flex flex-wrap justify-between items-center gap-2 mb-2 border border-gray-200 rounded p-2 bg-gray-50/50"
          >
            <span className="text-sm text-gray-800">
              {item.title} (Max {item.weight})
            </span>
            <select
              className={selectClass}
              value={form.presentationScores[i]}
              disabled={readOnly}
              onChange={(e) => handleScoreChange("presentationScores", i, e.target.value)}
            >
              {Array.from({ length: item.weight + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-800">
          <p>Report Total: {reportTotal} / 40</p>
          <p>Presentation Total: {presentationTotal} / 40</p>
          <hr className="my-2 border-gray-300" />
          <p>Report (15%): {reportFinal.toFixed(2)}</p>
          <p>Presentation (10%): {presentationFinal.toFixed(2)}</p>
          <h2 className="text-xl font-bold mt-3 text-gray-900">
            FINAL MARK: {finalMark} / 25
          </h2>
        </div>

        {!readOnly && onSubmit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-sm"
            >
              Submit evaluation
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExaminerUniversityEvaluationForm;
