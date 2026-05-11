const KEY = "monthlyEvaluations";

export const EVAL_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",       // company saved but not submitted
  SUBMITTED: "SUBMITTED",   // submitted to advisor
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const EVAL_STATUS_LABELS = {
  [EVAL_STATUS.NOT_STARTED]: "Not Started",
  [EVAL_STATUS.PENDING]:     "In Progress",
  [EVAL_STATUS.SUBMITTED]:   "Submitted to Advisor",
  [EVAL_STATUS.APPROVED]:    "Approved",
  [EVAL_STATUS.REJECTED]:    "Rejected — Reopen for Edit",
};

// ── helpers ──────────────────────────────────────────────────────────────────

export const getAllEvaluations = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

/** Return the evaluation record for a specific student + month, or null */
export const getEvaluation = (studentId, month) => {
  const all = getAllEvaluations();
  return all.find((e) => e.studentId === studentId && e.month === month) || null;
};

/**
 * Company submits (or re-submits after rejection).
 * Creates or replaces the record.
 */
export const submitEvaluation = ({ studentId, companyId, advisorName = "", month, evaluationData }) => {
  const all = getAllEvaluations();
  const idx = all.findIndex((e) => e.studentId === studentId && e.month === month);

  const record = {
    id: idx >= 0 ? all[idx].id : Date.now(),
    studentId,
    companyId,
    advisorName,                    // ← stored so advisor can filter
    month,                          // 1 or 2
    evaluationData,
    submittedAt: new Date().toISOString(),
    companyStatus: "SUBMITTED",
    advisorStatus: "PENDING",
    status: EVAL_STATUS.SUBMITTED,
    advisorComment: "",
  };

  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  saveAll(all);
  return record;
};

/**
 * Advisor approves or rejects.
 */
export const advisorDecideEvaluation = (studentId, month, action, comment = "") => {
  const all = getAllEvaluations();
  const idx = all.findIndex((e) => e.studentId === studentId && e.month === month);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    advisorStatus: action === "approve" ? "APPROVED" : "REJECTED",
    status: action === "approve" ? EVAL_STATUS.APPROVED : EVAL_STATUS.REJECTED,
    advisorComment: comment,
    decidedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
};

// ── Auto-reminder logic ───────────────────────────────────────────────────────

/**
 * Given an internship start date string (YYYY-MM-DD), return which months
 * (1 and/or 2) are "due" — i.e. at least that many months have elapsed.
 */
export const getDueMonths = (startDateStr) => {
  if (!startDateStr) return [];
  const start = new Date(startDateStr);
  if (isNaN(start)) return [];
  const now = new Date();
  const diffMs = now - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const due = [];
  if (diffDays >= 30) due.push(1);
  if (diffDays >= 60) due.push(2);
  return due;
};
