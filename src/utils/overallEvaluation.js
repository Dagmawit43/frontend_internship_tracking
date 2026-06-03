import { getAdvisorEvaluation, ADVISOR_EVAL_STATUS } from "./advisorEvaluations";
import { getExaminerEvaluationsForStudent, findExaminerEvalForStaffField } from "./examinerEvaluations";
import { getEvaluation, EVAL_STATUS } from "./monthlyEvaluations";
import { getFinalEvaluation, FINAL_EVAL_STATUS } from "./finalEvaluations";

const KEY = "overallEvaluationApprovals";

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const writeAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

export const getOverallApprovals = (studentId) => {
  const sid = String(studentId ?? "");
  const all = readAll();
  return (
    all.find((r) => String(r.studentId) === sid) || {
      studentId: sid,
      advisorApproved: false,
      examiner1Approved: false,
      examiner2Approved: false,
      coordinatorApproved: false,
      advisorApprovedAt: null,
      examiner1ApprovedAt: null,
      examiner2ApprovedAt: null,
      coordinatorApprovedAt: null,
    }
  );
};

export const setOverallApproval = (studentId, patch) => {
  const sid = String(studentId ?? "");
  const all = readAll();
  const idx = all.findIndex((r) => String(r.studentId) === sid);
  const prev = idx >= 0 ? all[idx] : getOverallApprovals(sid);
  const next = { ...prev, ...patch, studentId: sid };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeAll(all);
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("overall-evaluation-updated", { detail: { studentId: sid } }));
  return next;
};

export const approveOverallAsAdvisor = (studentId) =>
  setOverallApproval(studentId, {
    advisorApproved: true,
    advisorApprovedAt: new Date().toISOString(),
  });

export const approveOverallAsCoordinator = (studentId) =>
  setOverallApproval(studentId, {
    coordinatorApproved: true,
    coordinatorApprovedAt: new Date().toISOString(),
  });

export const approveOverallAsExaminerSlot = (studentId, slot /* 1|2 */) => {
  if (slot === 1) {
    return setOverallApproval(studentId, {
      examiner1Approved: true,
      examiner1ApprovedAt: new Date().toISOString(),
    });
  }
  if (slot === 2) {
    return setOverallApproval(studentId, {
      examiner2Approved: true,
      examiner2ApprovedAt: new Date().toISOString(),
    });
  }
  return getOverallApprovals(studentId);
};

/**
 * Compute overall mark (/100) from:
 * Academic (60%):
 * - Advisor evaluation: finalMark / 35 → weighted /40
 * - Examiner 1 eval: finalMark / 25 → weighted /30
 * - Examiner 2 eval: finalMark / 25 → weighted /30
 *
 * Company (40%):
 * - Company monthly evaluation: (Month1 /20 + Month2 /20) averaged → /20
 * - Company final evaluation: /20
 * Company total = /40 (Monthly /20 + Final /20)
 *
 * Overall /100:
 *   overall = academicOverall100 * 0.60 + companyTotal40
 */
/** 
 * Pure logic for overall mark calculation (/100) 
 * Returns Number (0-100)
 */
export const calculateOverallMark100 = ({ advisorMark, ex1Mark, ex2Mark, companyTotal40 }) => {
  const advW = advisorMark != null && !isNaN(advisorMark) ? (advisorMark / 35) * 40 : 0;
  const ex1W = ex1Mark != null && !isNaN(ex1Mark) ? (ex1Mark / 25) * 30 : 0;
  const ex2W = ex2Mark != null && !isNaN(ex2Mark) ? (ex2Mark / 25) * 30 : 0;

  const academic100 = advW + ex1W + ex2W;
  const company40 = companyTotal40 != null && !isNaN(companyTotal40) ? companyTotal40 : 0;

  return Number(((academic100 * 0.6) + company40).toFixed(2));
};

/**
 * Compute overall mark (/100) from localStorage + API patches
 */
export const computeOverallEvaluation = (studentApp) => {
  const studentId = String(studentApp?.studentId ?? "").trim() || null;
  const advisorRec = studentId ? getAdvisorEvaluation(studentId) : null;
  const examinerList = studentId ? getExaminerEvaluationsForStudent(studentId) : [];

  const ex1Rec = findExaminerEvalForStaffField(examinerList, studentApp?.examinerName);
  const ex2Rec = findExaminerEvalForStaffField(examinerList, studentApp?.examiner2Name);

  const raw = studentApp?.__raw || {};

  const apiRawScore = raw.final_total_score ?? raw.overall_mark_100;
  const apiOverallMark = (apiRawScore != null && Number(apiRawScore) > 0) ? Number(apiRawScore) : null;
  const apiAcademicTotal = (raw.academic_overall_100 != null && Number(raw.academic_overall_100) > 0) ? Number(raw.academic_overall_100) : null;
  const apiAdvisorScore = (raw.advisor_score != null) ? Number(raw.advisor_score) : NaN;
  const apiEx1Score = (raw.examiner_one_score != null) ? Number(raw.examiner_one_score) : NaN;
  const apiEx2Score = (raw.examiner_two_score != null) ? Number(raw.examiner_two_score) : NaN;

  const advisorMark = (Number.isFinite(Number(apiAdvisorScore)) && Number(apiAdvisorScore) > 0)
    ? Number(apiAdvisorScore)
    : (advisorRec?.status === ADVISOR_EVAL_STATUS.SUBMITTED
      ? Number(advisorRec.formData?.finalMark ?? advisorRec.formData?.final_mark ?? NaN)
      : NaN);

  const ex1Mark = (Number.isFinite(Number(apiEx1Score)) && Number(apiEx1Score) > 0)
    ? Number(apiEx1Score)
    : Number(ex1Rec?.formData?.finalMark ?? NaN);

  const ex2Mark = (Number.isFinite(Number(apiEx2Score)) && Number(apiEx2Score) > 0)
    ? Number(apiEx2Score)
    : Number(ex2Rec?.formData?.finalMark ?? NaN);

  const apiCompanyMonAvg = (raw.company_monthly_avg != null && Number(raw.company_monthly_avg) > 0) ? Number(raw.company_monthly_avg) : null;
  const apiCompanyFinalMark = (raw.company_final_score != null && Number(raw.company_final_score) > 0) ? Number(raw.company_final_score) : null;
  const apiCompanyTotal = (raw.company_score != null && Number(raw.company_score) > 0) ? Number(raw.company_score) : null;

  const m1 = studentId ? getEvaluation(studentId, 1) : null;
  const m2 = studentId ? getEvaluation(studentId, 2) : null;
  const finalEval = studentId ? getFinalEvaluation(studentId) : null;

  const m1Perf = Number(m1?.evaluationData?.monthlyPerformance ?? NaN);
  const m2Perf = Number(m2?.evaluationData?.monthlyPerformance ?? NaN);
  const monthlyAvg20 = Number.isFinite(m1Perf) && Number.isFinite(m2Perf) ? (m1Perf + m2Perf) / 2 : NaN;
  const finalCompany20 = Number(finalEval?.finalMark ?? NaN);

  const companyMonthly20 = apiCompanyMonAvg ?? (Number.isFinite(monthlyAvg20) ? Number(monthlyAvg20.toFixed(2)) : null);
  const companyFinal20 = apiCompanyFinalMark ?? (Number.isFinite(finalCompany20) ? finalCompany20 : null);
  const companyTotal40 = apiCompanyTotal ?? (
    companyMonthly20 != null && companyFinal20 != null
      ? Number((companyMonthly20 + companyFinal20).toFixed(2))
      : null
  );

  const overallMark100 = apiOverallMark ?? calculateOverallMark100({
    advisorMark,
    ex1Mark,
    ex2Mark,
    companyTotal40
  });

  const finalGrade = raw.final_grade || calculateGrade(overallMark100);

  const academicComplete = Number.isFinite(advisorMark) && Number.isFinite(ex1Mark) && Number.isFinite(ex2Mark);
  const companyComplete = companyTotal40 != null;

  return {
    advisorRec,
    ex1Rec,
    ex2Rec,
    month1Rec: m1,
    month2Rec: m2,
    finalCompanyRec: finalEval,
    academicOverall100: Number(((Number.isFinite(advisorMark) ? (advisorMark / 35) * 40 : 0) + (Number.isFinite(ex1Mark) ? (ex1Mark / 25) * 30 : 0) + (Number.isFinite(ex2Mark) ? (ex2Mark / 25) * 30 : 0)).toFixed(2)),
    companyMonAvg: companyMonthly20,
    companyFinalMark: companyFinal20,
    companyTotal40,
    overallMark100,
    finalGrade,
    complete: academicComplete && companyComplete,
    missing: {
      advisor: !Number.isFinite(advisorMark),
      examiner1: !Number.isFinite(ex1Mark),
      examiner2: !Number.isFinite(ex2Mark),
      month1: !(m1 && (m1.status === EVAL_STATUS.SUBMITTED || m1.status === EVAL_STATUS.APPROVED)),
      month2: !(m2 && (m2.status === EVAL_STATUS.SUBMITTED || m2.status === EVAL_STATUS.APPROVED)),
      finalCompany: !(finalEval && finalEval.status !== FINAL_EVAL_STATUS.NOT_STARTED),
    },
  };
};

export const calculateGrade = (mark) => {
  if (mark == null || isNaN(mark)) return null;
  if (mark >= 95) return "A+";
  if (mark >= 85) return "A";
  if (mark >= 80) return "A-";
  if (mark >= 75) return "B+";
  if (mark >= 70) return "B";
  if (mark >= 65) return "B-";
  if (mark >= 60) return "C+";
  if (mark >= 55) return "C";
  if (mark >= 50) return "C-";
  if (mark >= 40) return "D";
  return "F";
};

