import React, { useState, useEffect, useMemo } from "react";
import { Lock } from "lucide-react";

/** REPORT SECTION (out of 20) */
export const ADVISOR_EVAL_REPORT_ITEMS = [
  { title: "Format", weight: 2 },
  { title: "Organization Background", weight: 2 },
  { title: "Activities", weight: 3 },
  { title: "Usage of Data/Figure/Table", weight: 4 },
  { title: "Report Content", weight: 5 },
  { title: "Recommendation", weight: 2 },
  { title: "Conclusion", weight: 2 },
];

/** LOGBOOK SECTION (out of 5) — each item max 1 */
export const ADVISOR_EVAL_LOGBOOK_ITEMS = [
  { title: "Use of Pictures and Data", weight: 1 },
  { title: "Weekly Summary", weight: 1 },
  { title: "Daily Detail Report", weight: 1 },
  { title: "Improvement", weight: 1 },
  { title: "Initiative", weight: 1 },
];

/** STUDENT PERFORMANCE (out of 10) */
export const ADVISOR_EVAL_PERFORMANCE_ITEMS = [
  { title: "Understanding Objectives", weight: 5 },
  { title: "Engagement Level", weight: 3 },
  { title: "Discipline", weight: 2 },
];

const REPORT_MAX = ADVISOR_EVAL_REPORT_ITEMS.reduce((s, i) => s + i.weight, 0);
const LOGBOOK_MAX = ADVISOR_EVAL_LOGBOOK_ITEMS.reduce((s, i) => s + i.weight, 0);
const PERFORMANCE_MAX = ADVISOR_EVAL_PERFORMANCE_ITEMS.reduce((s, i) => s + i.weight, 0);
const FINAL_MAX = REPORT_MAX + LOGBOOK_MAX + PERFORMANCE_MAX;

const zeroScores = (len) => Array(len).fill(0);

const normalizeScores = (arr, len) => {
  if (!Array.isArray(arr) || arr.length !== len) return zeroScores(len);
  return arr.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
};

const buildEmpty = () => ({
  studentName: "",
  idNo: "",
  department: "",
  organization: "",
  supervisorName: "",
  reportScores: zeroScores(ADVISOR_EVAL_REPORT_ITEMS.length),
  logbookScores: zeroScores(ADVISOR_EVAL_LOGBOOK_ITEMS.length),
  performanceScores: zeroScores(ADVISOR_EVAL_PERFORMANCE_ITEMS.length),
});

/**
 * Internship supervisor-style advisor evaluation (Report 20 + Logbook 5 + Performance 10 = /35).
 * @param {object} initialData
 * @param {boolean} readOnly
 * @param {function} onSubmit
 */
const AdvisorStudentEvaluationForm = ({
  initialData = {},
  readOnly = false,
  onSubmit,
}) => {
  const mergedInitial = useMemo(() => {
    const empty = buildEmpty();
    const raw = { ...empty, ...initialData };
    raw.idNo = initialData.idNo ?? initialData.studentId ?? raw.idNo ?? "";
    raw.organization =
      initialData.organization ?? initialData.companyName ?? raw.organization ?? "";
    raw.supervisorName =
      initialData.supervisorName ??
      initialData.advisorName ??
      initialData.examinerName ??
      raw.supervisorName ??
      "";
    raw.reportScores = normalizeScores(
      initialData.reportScores,
      ADVISOR_EVAL_REPORT_ITEMS.length
    );
    raw.logbookScores = normalizeScores(
      initialData.logbookScores,
      ADVISOR_EVAL_LOGBOOK_ITEMS.length
    );
    raw.performanceScores = normalizeScores(
      initialData.performanceScores,
      ADVISOR_EVAL_PERFORMANCE_ITEMS.length
    );
    return raw;
  }, [initialData]);

  const [form, setForm] = useState(mergedInitial);

  useEffect(() => {
    setForm(mergedInitial);
  }, [mergedInitial]);

  const handleChange = (section, index, value) => {
    if (readOnly) return;
    setForm((prev) => {
      const updated = [...prev[section]];
      updated[index] = Number(value);
      return { ...prev, [section]: updated };
    });
  };

  const setSupervisorName = (value) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, supervisorName: value }));
  };

  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const reportTotal = sum(form.reportScores);
  const logbookTotal = sum(form.logbookScores);
  const performanceTotal = sum(form.performanceScores);
  const finalMark = (reportTotal + logbookTotal + performanceTotal).toFixed(2);

  const selectClass = readOnly
    ? "border border-gray-200 rounded p-1 text-sm bg-gray-50 cursor-not-allowed min-w-[3.5rem]"
    : "border border-gray-300 rounded p-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[3.5rem]";

  const renderSection = (title, items, sectionKey) => (
    <div className="mb-6">
      <h2 className="font-bold text-lg mb-3 text-gray-900">{title}</h2>
      {items.map((item, i) => (
        <div
          key={`${sectionKey}-${item.title}`}
          className="flex flex-wrap justify-between items-center gap-2 mb-2 border border-gray-200 p-2 rounded bg-gray-50/50"
        >
          <span className="text-sm text-gray-800">
            {item.title} (Max {item.weight})
          </span>
          <select
            className={selectClass}
            value={form[sectionKey][i]}
            disabled={readOnly}
            onChange={(e) => handleChange(sectionKey, i, e.target.value)}
          >
            {Array.from({ length: item.weight + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    onSubmit({
      ...form,
      reportScores: [...form.reportScores],
      logbookScores: [...form.logbookScores],
      performanceScores: [...form.performanceScores],
      reportTotal,
      logbookTotal,
      performanceTotal,
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
          Internship Supervisor Evaluation Form
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <input
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            placeholder="Student Name"
            value={form.studentName}
            readOnly
          />
          <input
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            placeholder="ID No"
            value={form.idNo}
            readOnly
          />
          <input
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            placeholder="Department"
            value={form.department}
            readOnly
          />
          <input
            className="border border-gray-200 rounded p-2 text-sm bg-gray-50 text-gray-800"
            placeholder="Organization"
            value={form.organization}
            readOnly
          />
        </div>

        {renderSection("1. REPORT (20)", ADVISOR_EVAL_REPORT_ITEMS, "reportScores")}
        {renderSection("2. LOG BOOK (5)", ADVISOR_EVAL_LOGBOOK_ITEMS, "logbookScores")}
        {renderSection(
          "3. STUDENT PERFORMANCE (10)",
          ADVISOR_EVAL_PERFORMANCE_ITEMS,
          "performanceScores"
        )}

        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-800">
          <p>
            <span className="font-semibold">Report Total:</span> {reportTotal} / {REPORT_MAX}
          </p>
          <p>
            <span className="font-semibold">Logbook Total:</span> {logbookTotal} / {LOGBOOK_MAX}
          </p>
          <p>
            <span className="font-semibold">Performance Total:</span> {performanceTotal} /{" "}
            {PERFORMANCE_MAX}
          </p>
          <hr className="my-2 border-gray-300" />
          <h2 className="text-xl font-bold text-gray-900">
            FINAL MARK: {finalMark} / {FINAL_MAX}
          </h2>
        </div>

        <div className="mt-6">
          <input
            className={`w-full border rounded p-2 text-sm ${
              readOnly ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white"
            }`}
            placeholder="Supervisor Name & Signature"
            value={form.supervisorName}
            readOnly={readOnly}
            onChange={(e) => setSupervisorName(e.target.value)}
          />
        </div>

        {!readOnly && onSubmit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
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
