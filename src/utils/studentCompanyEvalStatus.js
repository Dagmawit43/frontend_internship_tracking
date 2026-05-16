import { EVAL_STATUS, getEvaluation } from "./monthlyEvaluations";
import { FINAL_EVAL_STATUS, getFinalEvaluation } from "./finalEvaluations";

export const STUDENT_COMPANY_EVAL_STATUS = {
  PENDING: "Pending",
  SUBMITTED_TO_ADVISOR: "Submitted to Advisor",
  APPROVED: "Approved",
};

const monthlyToStudent = (record) => {
  if (
    !record ||
    record.status === EVAL_STATUS.NOT_STARTED ||
    record.status === EVAL_STATUS.PENDING ||
    record.status === EVAL_STATUS.REJECTED
  ) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.PENDING,
      submittedAt: null,
      approvedAt: null,
    };
  }
  if (record.status === EVAL_STATUS.SUBMITTED) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.SUBMITTED_TO_ADVISOR,
      submittedAt: record.submittedAt || null,
      approvedAt: null,
    };
  }
  if (record.status === EVAL_STATUS.APPROVED) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.APPROVED,
      submittedAt: record.submittedAt || null,
      approvedAt: record.decidedAt || null,
    };
  }
  return {
    label: STUDENT_COMPANY_EVAL_STATUS.PENDING,
    submittedAt: null,
    approvedAt: null,
  };
};

const finalToStudent = (record) => {
  if (!record || record.status === FINAL_EVAL_STATUS.NOT_STARTED) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.PENDING,
      submittedAt: null,
      approvedAt: null,
    };
  }
  if (record.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.SUBMITTED_TO_ADVISOR,
      submittedAt: record.submittedAt || null,
      approvedAt: null,
    };
  }
  if (
    record.status === FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR ||
    record.status === FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL ||
    record.status === FINAL_EVAL_STATUS.FINAL_APPROVED
  ) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.APPROVED,
      submittedAt: record.submittedAt || null,
      approvedAt: record.advisorDecidedAt || null,
    };
  }
  if (record.status === FINAL_EVAL_STATUS.REJECTED) {
    return {
      label: STUDENT_COMPANY_EVAL_STATUS.PENDING,
      submittedAt: null,
      approvedAt: null,
    };
  }
  return {
    label: STUDENT_COMPANY_EVAL_STATUS.PENDING,
    submittedAt: null,
    approvedAt: null,
  };
};

export const getStudentCompanyEvaluationSummaries = (studentId) => {
  const sid = String(studentId ?? "").trim();
  const month1 = monthlyToStudent(getEvaluation(sid, 1));
  const month2 = monthlyToStudent(getEvaluation(sid, 2));
  const finalEval = finalToStudent(getFinalEvaluation(sid));

  return [
    {
      key: "month-1",
      title: "Company Month 1 Evaluation Form",
      ...month1,
    },
    {
      key: "month-2",
      title: "Company Month 2 Evaluation Form",
      ...month2,
    },
    {
      key: "final",
      title: "Company Final Evaluation Form",
      ...finalEval,
    },
  ];
};

export const studentCompanyEvalStatusPill = (label) => {
  if (label === STUDENT_COMPANY_EVAL_STATUS.APPROVED) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (label === STUDENT_COMPANY_EVAL_STATUS.SUBMITTED_TO_ADVISOR) {
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  }
  return "bg-amber-100 text-amber-900 border-amber-200";
};
