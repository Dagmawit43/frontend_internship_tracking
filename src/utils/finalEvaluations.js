const KEY = "finalEvaluations";

export const FINAL_EVAL_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  PENDING_ADVISOR_APPROVAL: "PENDING_ADVISOR_APPROVAL",
  APPROVED_BY_ADVISOR: "APPROVED_BY_ADVISOR",
  PENDING_EXAMINER_APPROVAL: "PENDING_EXAMINER_APPROVAL",
  FINAL_APPROVED: "FINAL_APPROVED",
  REJECTED: "REJECTED",
};

export const FINAL_EVAL_STATUS_LABELS = {
  [FINAL_EVAL_STATUS.NOT_STARTED]: "Not Started",
  [FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL]: "Pending Advisor Approval",
  [FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR]: "Approved by Advisor",
  [FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL]: "Pending Examiner Approval",
  [FINAL_EVAL_STATUS.FINAL_APPROVED]: "Final Approved",
  [FINAL_EVAL_STATUS.REJECTED]: "Rejected",
};

// ── helpers ──────────────────────────────────────────────────────────────────

export const getAllFinalEvaluations = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAll = (list) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
};

/** Return the final evaluation record for a specific student, or null */
export const getFinalEvaluation = (studentId) => {
  const sid = String(studentId ?? "");
  const all = getAllFinalEvaluations();
  return all.find((e) => String(e.studentId) === sid) || null;
};

/**
 * Company submits final evaluation.
 */
export const submitFinalEvaluation = ({ studentId, studentName, companyName, formData, total, finalMark }) => {
  const all = getAllFinalEvaluations();
  const idx = all.findIndex((e) => e.studentId === studentId);

  const record = {
    id: idx >= 0 ? all[idx].id : Date.now(),
    studentId,
    studentName,
    companyName,
    formData,
    total,
    finalMark: Number(finalMark),
    status: FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL,
    submittedAt: new Date().toISOString(),
    advisorComment: "",
    examinerComment: "",
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
export const advisorDecideFinalEvaluation = (studentId, action, comment = "") => {
  const all = getAllFinalEvaluations();
  const idx = all.findIndex((e) => e.studentId === studentId);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    status: action === "approve" ? FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR : FINAL_EVAL_STATUS.REJECTED,
    advisorComment: comment,
    advisorDecidedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
};

/**
 * Examiner approves or rejects.
 */
export const examinerDecideFinalEvaluation = (studentId, action, comment = "") => {
  const all = getAllFinalEvaluations();
  const idx = all.findIndex((e) => e.studentId === studentId);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    status: action === "approve" ? FINAL_EVAL_STATUS.FINAL_APPROVED : FINAL_EVAL_STATUS.REJECTED,
    examinerComment: comment,
    examinerDecidedAt: new Date().toISOString(),
  };
  saveAll(all);
  return all[idx];
};

/**
 * Get pending final evaluations for advisor
 */
export const getPendingAdvisorFinalEvaluations = () => {
  const all = getAllFinalEvaluations();
  return all.filter(e => e.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL);
};

/**
 * Get pending final evaluations for examiner
 */
export const getPendingExaminerFinalEvaluations = () => {
  const all = getAllFinalEvaluations();
  return all.filter(e => e.status === FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL);
};