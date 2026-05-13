import React, { useState, useEffect, useMemo } from "react";
import { Lock } from "lucide-react";

// =========================
// 1. REPORT (20%) — max raw 40 → scaled to /20
// =========================
export const ADVISOR_EVAL_REPORT_ITEMS = [
  { title: "Format: Report format and neatness", weight: 4 },
  { title: "Organization Background: Clear and detailed description", weight: 4 },
  {
    title: "Activities: Activities with clear description of problems faced",
    weight: 6,
  },
  {
    title: "Usage of Data/Figure/Table: Appropriate supporting diagram",
    weight: 8,
  },
  {
    title:
      "Report Content: Reports are comprehensive and have technical detail",
    weight: 10,
  },
  { title: "Recommendation: Logical and useful recommendation", weight: 4 },
  {
    title: "Conclusion: Comprehensive with good technical content",
    weight: 4,
  },
];

// =========================
// 2. LOG BOOK (5%) — max raw 25 → scaled to /5
// =========================
export const ADVISOR_EVAL_LOGBOOK_ITEMS = [
  { title: "Use of Pictures and Data in the entries", weight: 5 },
  { title: "Summary of Activities: Write weekly summary accordingly", weight: 5 },
  {
    title:
      "Daily Detail Report: Write daily report continuously and consistently",
    weight: 5,
  },
  {
    title: "Improvement: Improve it based on supervisor recommendations",
    weight: 5,
  },
  {
    title:
      "Initiative: Has the initiative to perform tasks and solve problems",
    weight: 5,
  },
];

// =========================
// 3. STUDENT PERFORMANCE (10%) — max raw 18 → scaled to /10
// =========================
export const ADVISOR_EVAL_PERFORMANCE_ITEMS = [
  { title: "Understanding the overall internship objective", weight: 10 },
  { title: "Level of engagement", weight: 6 },
  { title: "Discipline", weight: 2 },
];

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const REPORT_MAX = sum(ADVISOR_EVAL_REPORT_ITEMS.map((i) => i.weight));
const LOGBOOK_MAX = sum(ADVISOR_EVAL_LOGBOOK_ITEMS.map((i) => i.weight));
const PERFORMANCE_MAX = sum(ADVISOR_EVAL_PERFORMANCE_ITEMS.map((i) => i.weight));

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
 * University supervisor internship evaluation (weighted Report / Logbook / Performance → /35).
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

  const handleInput = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (section, index, value) => {
    if (readOnly) return;
    setForm((prev) => {
      const updated = [...prev[section]];
      updated[index] = Number(value);
      return { ...prev, [section]: updated };
    });
  };

  const reportRaw = sum(form.reportScores);
  const logbookRaw = sum(form.logbookScores);
  const performanceRaw = sum(form.performanceScores);

  const reportFinal = ((reportRaw / REPORT_MAX) * 20).toFixed(2);
  const logbookFinal = ((logbookRaw / LOGBOOK_MAX) * 5).toFixed(2);
  const performanceFinal = ((performanceRaw / PERFORMANCE_MAX) * 10).toFixed(2);
  const finalMark = (
    Number(reportFinal) +
    Number(logbookFinal) +
    Number(performanceFinal)
  ).toFixed(2);

  const selectClass = readOnly
    ? "border border-gray-200 p-2 rounded w-24 text-sm bg-gray-50 cursor-not-allowed shrink-0"
    : "border border-gray-300 p-2 rounded w-24 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shrink-0";

  const renderSection = (title, items, sectionKey, rawTotal, maxTotal) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-gray-900">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={`${sectionKey}-${i}`}
            className="flex flex-col md:flex-row md:items-center justify-between border border-gray-200 p-3 rounded-lg bg-white/80"
          >
            <div className="font-medium md:w-3/4 text-sm text-gray-800">
              {i + 1}. {item.title}
            </div>
            <select
              className={`${selectClass} mt-2 md:mt-0`}
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
      <div className="mt-4 bg-gray-100 p-3 rounded font-semibold text-sm text-gray-800">
        Marks Obtained: {rawTotal} / {maxTotal}
      </div>
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
      reportRaw,
      logbookRaw,
      performanceRaw,
      reportFinal: Number(reportFinal),
      logbookFinal: Number(logbookFinal),
      performanceFinal: Number(performanceFinal),
      finalMark: Number(finalMark),
    });
  };

  const readonlyInput =
    "border border-gray-200 p-3 rounded text-sm bg-gray-50 text-gray-800 cursor-not-allowed";
  const editableInput =
    "border border-gray-300 p-3 rounded text-sm bg-white";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {readOnly && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
          Submitted evaluation — read only.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-900">
          UNIVERSITY SUPERVISOR INTERNSHIP EVALUATION FORM
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Addis Ababa Science and Technology University
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input
            name="studentName"
            value={form.studentName}
            readOnly
            className={readonlyInput}
            placeholder="Student Name"
          />
          <input
            name="idNo"
            value={form.idNo}
            readOnly
            className={readonlyInput}
            placeholder="ID No"
          />
          <input
            name="department"
            value={form.department}
            readOnly
            className={readonlyInput}
            placeholder="Department"
          />
          <input
            name="organization"
            value={form.organization}
            readOnly
            className={readonlyInput}
            placeholder="Organization"
          />
        </div>

        {renderSection(
          "1. REPORT (20%)",
          ADVISOR_EVAL_REPORT_ITEMS,
          "reportScores",
          reportRaw,
          REPORT_MAX
        )}
        {renderSection(
          "2. LOG BOOK (5%)",
          ADVISOR_EVAL_LOGBOOK_ITEMS,
          "logbookScores",
          logbookRaw,
          LOGBOOK_MAX
        )}
        {renderSection(
          "3. STUDENT PERFORMANCE (10%)",
          ADVISOR_EVAL_PERFORMANCE_ITEMS,
          "performanceScores",
          performanceRaw,
          PERFORMANCE_MAX
        )}

        <div className="mt-8 bg-gray-100 p-6 rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Evaluation Summary</h2>
          <div className="space-y-3 text-base sm:text-lg text-gray-800">
            <p>
              Report Score:{" "}
              <span className="font-bold">{reportFinal} / 20</span>
            </p>
            <p>
              Log Book Score:{" "}
              <span className="font-bold">{logbookFinal} / 5</span>
            </p>
            <p>
              Student Performance Score:{" "}
              <span className="font-bold">{performanceFinal} / 10</span>
            </p>
            <hr className="my-4 border-gray-300" />
            <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
              FINAL MARK: {finalMark} / 35
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <input
            name="supervisorName"
            value={form.supervisorName}
            onChange={handleInput}
            readOnly={readOnly}
            className={`w-full p-3 rounded text-sm ${readOnly ? readonlyInput : editableInput}`}
            placeholder="Supervisor Name & Signature"
          />
        </div>

        {!readOnly && onSubmit && (
          <div className="mt-8 pt-4 border-t border-gray-200">
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
