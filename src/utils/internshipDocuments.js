const KEY = "internshipStudentDocuments";

export const ROLE_DOC_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const norm = (s) => String(s || "").trim().toLowerCase();

export const getAllInternshipDocuments = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));

export const getDocumentsByStudentId = (studentId) => {
  const sid = String(studentId ?? "");
  return getAllInternshipDocuments()
    .filter((d) => String(d.studentId ?? "") === sid)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

/** Human-readable combined status for the student UI */
export const getStudentDocumentSummary = (d) => {
  const a = d.advisorStatus || ROLE_DOC_STATUS.PENDING;
  const e = d.examinerStatus || ROLE_DOC_STATUS.PENDING;
  if (a === ROLE_DOC_STATUS.REJECTED || e === ROLE_DOC_STATUS.REJECTED) {
    return { text: "Rejected by advisor or examiner", tone: "red" };
  }
  if (a === ROLE_DOC_STATUS.APPROVED && e === ROLE_DOC_STATUS.APPROVED) {
    return { text: "Approved by advisor & examiner", tone: "green" };
  }
  if (a === ROLE_DOC_STATUS.APPROVED && e !== ROLE_DOC_STATUS.APPROVED) {
    return { text: "Approved by advisor — pending examiner", tone: "amber" };
  }
  if (e === ROLE_DOC_STATUS.APPROVED && a !== ROLE_DOC_STATUS.APPROVED) {
    return { text: "Approved by examiner — pending advisor", tone: "amber" };
  }
  return { text: "Pending advisor & examiner", tone: "gray" };
};

const pushNotification = (entry) => {
  try {
    const list = JSON.parse(localStorage.getItem("notifications") || "[]");
    list.push({ id: Date.now() + Math.floor(Math.random() * 1000), read: false, ...entry });
    localStorage.setItem("notifications", JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

export const submitInternshipDocument = ({
  studentId,
  studentName,
  title,
  description,
  fileName,
  fileData,
  advisorName,
  examinerName,
  examiner2Name,
}) => {
  const all = getAllInternshipDocuments();
  const doc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    studentId: String(studentId ?? ""),
    studentName: studentName || "",
    title: (title || fileName || "Internship document").trim(),
    description: (description || "").trim(),
    fileName: fileName || "file",
    fileData,
    advisorName: advisorName || "",
    examinerName: examinerName || "",
    examiner2Name: examiner2Name || "",
    advisorStatus: ROLE_DOC_STATUS.PENDING,
    examinerStatus: ROLE_DOC_STATUS.PENDING,
    advisorComment: "",
    examinerComment: "",
    examinerDecidedBy: "",
    submittedAt: new Date().toISOString(),
  };
  all.push(doc);
  saveAll(all);

  const baseMsg = `${studentName || "A student"} submitted an internship document: "${doc.title}".`;
  pushNotification({
    type: "info",
    title: "New internship document",
    message: `${baseMsg} Please review in your dashboard.`,
    date: new Date().toISOString(),
    studentId,
    studentName,
    advisorName: advisorName || null,
    examinerTarget: true,
  });

  window.dispatchEvent(new Event("storage"));
  return doc;
};

export const advisorDecideInternshipDocument = (docId, action, comment = "") => {
  const all = getAllInternshipDocuments();
  const i = all.findIndex((d) => d.id === docId);
  if (i < 0) return null;
  const status =
    action === "approve" ? ROLE_DOC_STATUS.APPROVED : ROLE_DOC_STATUS.REJECTED;
  all[i] = {
    ...all[i],
    advisorStatus: status,
    advisorComment: comment || "",
    advisorDecidedAt: new Date().toISOString(),
  };
  saveAll(all);

  pushNotification({
    type: status === ROLE_DOC_STATUS.APPROVED ? "success" : "error",
    title:
      status === ROLE_DOC_STATUS.APPROVED
        ? "Document approved by advisor"
        : "Document rejected by advisor",
    message: `Your document "${all[i].title}" was ${status === ROLE_DOC_STATUS.APPROVED ? "approved" : "rejected"} by your advisor.`,
    date: new Date().toISOString(),
    studentId: all[i].studentId,
    studentName: all[i].studentName,
    read: false,
  });

  window.dispatchEvent(new Event("storage"));
  return all[i];
};

export const examinerCanReviewDocument = (doc, examinerIdentity) => {
  const id = norm(examinerIdentity);
  if (!id) return false;
  return norm(doc.examinerName) === id || norm(doc.examiner2Name) === id;
};

export const examinerDecideInternshipDocument = (
  docId,
  action,
  comment = "",
  decidedBy = ""
) => {
  const all = getAllInternshipDocuments();
  const i = all.findIndex((d) => d.id === docId);
  if (i < 0) return null;
  const status =
    action === "approve" ? ROLE_DOC_STATUS.APPROVED : ROLE_DOC_STATUS.REJECTED;
  all[i] = {
    ...all[i],
    examinerStatus: status,
    examinerComment: comment || "",
    examinerDecidedBy: decidedBy,
    examinerDecidedAt: new Date().toISOString(),
  };
  saveAll(all);

  pushNotification({
    type: status === ROLE_DOC_STATUS.APPROVED ? "success" : "error",
    title:
      status === ROLE_DOC_STATUS.APPROVED
        ? "Document approved by examiner"
        : "Document rejected by examiner",
    message: `Your document "${all[i].title}" was ${status === ROLE_DOC_STATUS.APPROVED ? "approved" : "rejected"} by the internal examiner.`,
    date: new Date().toISOString(),
    studentId: all[i].studentId,
    studentName: all[i].studentName,
    read: false,
  });

  window.dispatchEvent(new Event("storage"));
  return all[i];
};

export const getDocumentsForAdvisorStudents = (advisorIdentity, studentIds) => {
  const id = norm(advisorIdentity);
  const set = new Set(studentIds);
  return getAllInternshipDocuments().filter(
    (d) => set.has(d.studentId) && norm(d.advisorName) === id
  );
};

export const getDocumentsForExaminerStudents = (examinerIdentity, studentIds) => {
  const id = norm(examinerIdentity);
  const set = new Set(studentIds);
  return getAllInternshipDocuments().filter(
    (d) =>
      set.has(d.studentId) &&
      (norm(d.examinerName) === id || norm(d.examiner2Name) === id)
  );
};
