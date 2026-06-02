import { identityMatchesStaffField } from "./internshipDocuments";

const KEY = "internshipExaminerEvaluations";
export const EXAMINER_EVAL_STATUS = {
  SUBMITTED: "SUBMITTED",
};

const norm = (s) => String(s ?? "").trim().toLowerCase();

/**
 * Find examiner evaluation row for coordinator-assigned examinerName / examiner2Name vs stored login key.
 */
export const findExaminerEvalForStaffField = (evaluations, staffFieldValue) => {
  if (!staffFieldValue || !evaluations?.length) return null;
  const byAlias = evaluations.find((e) =>
    identityMatchesStaffField(String(staffFieldValue), String(e.examinerKey || ""))
  );
  if (byAlias) return byAlias;
  const fk = norm(staffFieldValue);
  return evaluations.find((e) => norm(e.examinerName) === fk || norm(e.examinerKey) === fk) || null;
};

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const writeAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

/** One record per (internshipId, examiner identity, slot). Fallback to studentId for legacy logs. */
export const getExaminerEvaluation = (studentId, examinerKey, internshipId, slot) => {
  const sid = String(studentId ?? "");
  const iid = String(internshipId ?? "");
  const ek = norm(examinerKey);
  const sl = slot ? String(slot) : "";
  const all = readAll();

  if (iid) {
    const byInternship = all.find((e) => {
      const iidMatch = String(e.internshipId || e.internship) === iid;
      const ekMatch = norm(e.examinerKey) === ek;
      const slotMatch = !sl || !e.slot || String(e.slot) === sl;
      return iidMatch && ekMatch && slotMatch;
    });
    if (byInternship) return byInternship;
  }

  return all.find((e) => String(e.studentId) === sid && norm(e.examinerKey) === ek) || null;
};

export const getExaminerEvaluationsForStudent = (studentId) => {
  const sid = String(studentId ?? "");
  return readAll()
    .filter((e) => String(e.studentId) === sid)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

export const getExaminerEvaluationForAdvisorSlot = (studentId, examinerFieldFromApplication) =>
  findExaminerEvalForStaffField(
    getExaminerEvaluationsForStudent(studentId),
    examinerFieldFromApplication
  );

export const submitExaminerEvaluation = ({
  studentId,
  studentName,
  examinerKey,
  examinerName,
  advisorName,
  formData,
  internshipId,
  slot,
}) => {
  const sid = String(studentId);
  const iid = String(internshipId ?? "");
  const ek = norm(examinerKey);
  const sl = slot ? String(slot) : "";
  const all = readAll();

  const idx = all.findIndex((e) => {
    const sameExaminer = norm(e.examinerKey) === ek;
    if (!sameExaminer) return false;

    // Most specific: internship + slot
    if (iid && sl && (e.internshipId || e.internship) && e.slot) {
      return String(e.internshipId || e.internship) === iid && String(e.slot) === sl;
    }

    if (iid && (e.internshipId || e.internship)) {
      return String(e.internshipId || e.internship) === iid;
    }
    return String(e.studentId) === sid;
  });
  const record = {
    id: idx >= 0 ? all[idx].id : Date.now(),
    studentId: String(studentId),
    studentName: studentName || "",
    internshipId: iid,
    slot: sl,
    examinerKey: ek,
    examinerName: examinerName || "",
    formData: { ...formData },
    status: EXAMINER_EVAL_STATUS.SUBMITTED,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  writeAll(all);
  try {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const examinerLabel = examinerName || examinerKey || "Internal examiner";
    notifications.push({
      id: Date.now(),
      type: "info",
      title: "Examiner evaluation received",
      message: `${examinerLabel} submitted an internship examiner evaluation for you.`,
      date: new Date().toISOString(),
      studentId: sid,
      studentName: studentName || "",
      read: false,
    });
    if (advisorName) {
      notifications.push({
        id: Date.now() + 1,
        type: "info",
        title: "Examiner evaluation for your student",
        message: `${examinerLabel} submitted an examiner evaluation for ${studentName || "a student"} (${sid}).`,
        date: new Date().toISOString(),
        studentId: sid,
        studentName: studentName || "",
        advisorName: String(advisorName || "").trim(),
        read: false,
      });
    }
    localStorage.setItem("notifications", JSON.stringify(notifications));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("examiner-evaluation-updated", { detail: { studentId: sid } })
  );
  return record;
};
