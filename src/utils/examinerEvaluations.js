const KEY = "internshipExaminerEvaluations";

export const EXAMINER_EVAL_STATUS = {
  SUBMITTED: "SUBMITTED",
};

const norm = (s) => String(s ?? "").trim().toLowerCase();

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const writeAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

/** One record per (studentId, examiner identity). */
export const getExaminerEvaluation = (studentId, examinerKey) => {
  const sid = String(studentId ?? "");
  const ek = norm(examinerKey);
  return readAll().find((e) => String(e.studentId) === sid && norm(e.examinerKey) === ek) || null;
};

export const getExaminerEvaluationsForStudent = (studentId) => {
  const sid = String(studentId ?? "");
  return readAll()
    .filter((e) => String(e.studentId) === sid)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

export const submitExaminerEvaluation = ({
  studentId,
  studentName,
  examinerKey,
  examinerName,
  advisorName,
  formData,
}) => {
  const all = readAll();
  const ek = norm(examinerKey);
  const idx = all.findIndex(
    (e) => String(e.studentId) === String(studentId) && norm(e.examinerKey) === ek
  );
  const record = {
    id: idx >= 0 ? all[idx].id : Date.now(),
    studentId: String(studentId),
    studentName: studentName || "",
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

  const sid = String(studentId);
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
