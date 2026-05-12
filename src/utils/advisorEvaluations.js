const KEY = "advisorStudentEvaluations";

export const ADVISOR_EVAL_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
};

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const writeAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

/** One record per student (latest advisor evaluation). */
export const getAdvisorEvaluation = (studentId) => {
  const sid = String(studentId ?? "");
  return readAll().find((e) => String(e.studentId) === sid) || null;
};

export const submitAdvisorEvaluation = ({
  studentId,
  studentName,
  advisorName,
  formData,
}) => {
  const all = readAll();
  const idx = all.findIndex((e) => String(e.studentId) === String(studentId));
  const record = {
    id: idx >= 0 ? all[idx].id : Date.now(),
    studentId: String(studentId),
    studentName: studentName || "",
    advisorName: advisorName || "",
    formData: { ...formData },
    status: ADVISOR_EVAL_STATUS.SUBMITTED,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  writeAll(all);

  try {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: "info",
      title: "Advisor evaluation received",
      message: `Your academic advisor submitted an internship evaluation for you.`,
      date: new Date().toISOString(),
      studentId: String(studentId),
      studentName: studentName || "",
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("advisor-evaluation-updated", { detail: { studentId: String(studentId) } })
  );
  return record;
};
