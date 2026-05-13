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
export const computeOverallEvaluation = (studentApp) => {
  const studentId = studentApp?.studentId;
  const advisorRec = studentId ? getAdvisorEvaluation(studentId) : null;
  const examinerList = studentId ? getExaminerEvaluationsForStudent(studentId) : [];

  const advisorMark =
    advisorRec?.status === ADVISOR_EVAL_STATUS.SUBMITTED
      ? Number(advisorRec.formData?.finalMark ?? advisorRec.formData?.final_mark ?? NaN)
      : NaN;

  const ex1Rec = findExaminerEvalForStaffField(examinerList, studentApp?.examinerName);
  const ex2Rec = findExaminerEvalForStaffField(examinerList, studentApp?.examiner2Name);

  const ex1Mark = Number(ex1Rec?.formData?.finalMark ?? NaN);
  const ex2Mark = Number(ex2Rec?.formData?.finalMark ?? NaN);

  const hasAdvisor = Number.isFinite(advisorMark);
  const hasEx1 = Number.isFinite(ex1Mark);
  const hasEx2 = Number.isFinite(ex2Mark);

  const advisorWeighted = hasAdvisor ? (advisorMark / 35) * 40 : 0;
  const ex1Weighted = hasEx1 ? (ex1Mark / 25) * 30 : 0;
  const ex2Weighted = hasEx2 ? (ex2Mark / 25) * 30 : 0;

  const academicOverall100 = advisorWeighted + ex1Weighted + ex2Weighted;

  const m1 = studentId ? getEvaluation(studentId, 1) : null;
  const m2 = studentId ? getEvaluation(studentId, 2) : null;
  const finalEval = studentId ? getFinalEvaluation(studentId) : null;

  const m1Perf = Number(m1?.evaluationData?.monthlyPerformance ?? NaN);
  const m2Perf = Number(m2?.evaluationData?.monthlyPerformance ?? NaN);
  const hasM1 = Number.isFinite(m1Perf);
  const hasM2 = Number.isFinite(m2Perf);
  const monthlyAvg20 = hasM1 && hasM2 ? (m1Perf + m2Perf) / 2 : NaN;

  const finalCompany20 = Number(finalEval?.finalMark ?? NaN);
  const hasFinalCompany = Number.isFinite(finalCompany20);

  const companyMonthly20 = Number.isFinite(monthlyAvg20) ? Number(monthlyAvg20.toFixed(2)) : null;
  const companyFinal20 = hasFinalCompany ? finalCompany20 : null;
  const companyTotal40 =
    companyMonthly20 != null && companyFinal20 != null
      ? Number((companyMonthly20 + companyFinal20).toFixed(2))
      : null;

  const companyComplete = companyTotal40 != null;
  const academicComplete = hasAdvisor && hasEx1 && hasEx2;

  const overallMark100 = Number(((academicOverall100 * 0.6) + (companyTotal40 ?? 0)).toFixed(2));

  return {
    advisorRec,
    ex1Rec,
    ex2Rec,
    month1Rec: m1,
    month2Rec: m2,
    finalCompanyRec: finalEval,
    advisorMark: hasAdvisor ? advisorMark : null,
    ex1Mark: hasEx1 ? ex1Mark : null,
    ex2Mark: hasEx2 ? ex2Mark : null,
    academicOverall100: Number(academicOverall100.toFixed(2)),
    companyMonthly20,
    companyFinal20,
    companyTotal40,
    overallMark100,
    complete: academicComplete && companyComplete,
    missing: {
      advisor: !hasAdvisor,
      examiner1: !hasEx1,
      examiner2: !hasEx2,
      month1: !(m1 && (m1.status === EVAL_STATUS.SUBMITTED || m1.status === EVAL_STATUS.APPROVED)),
      month2: !(m2 && (m2.status === EVAL_STATUS.SUBMITTED || m2.status === EVAL_STATUS.APPROVED)),
      finalCompany: !(finalEval && finalEval.status !== FINAL_EVAL_STATUS.NOT_STARTED),
    },
  };
};

