const KEY = "internshipStudentDocuments";

export const ROLE_DOC_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const norm = (s) => String(s || "").trim().toLowerCase();

/** Active placement for a student (used to resolve advisor/examiner names). */
export const getActiveInternApplication = (studentId) => {
  try {
    const apps = JSON.parse(localStorage.getItem("applications") || "[]");
    const sid = String(studentId ?? "");
    return (
      apps.find(
        (a) =>
          String(a.studentId ?? "") === sid &&
          a.finalInternshipStatus === "ACTIVE_INTERN"
      ) || null
    );
  } catch {
    return null;
  }
};

/**
 * True if `identityLower` matches `fieldValue`, or both match the same otherUsers row
 * (handles coordinator display name vs advisor login username).
 */
export const identityMatchesStaffField = (fieldValue, identityLower) => {
  const id = norm(identityLower);
  const fv = norm(fieldValue);
  if (!id) return false;
  if (fv && fv === id) return true;

  let others = [];
  try {
    others = JSON.parse(localStorage.getItem("otherUsers") || "[]");
  } catch {
    others = [];
  }

  for (const u of others) {
    const aliases = [u.fullName, u.name, u.username, u.email]
      .map(norm)
      .filter(Boolean);
    if (!aliases.includes(id)) continue;
    if (!fv) return false;
    if (aliases.includes(fv)) return true;
  }
  return false;
};

export const documentBelongsToAdvisor = (doc, advisorIdentity) =>
  identityMatchesStaffField(
    doc.advisorName ||
      getActiveInternApplication(doc.studentId)?.advisorName ||
      "",
    advisorIdentity
  );

export const documentBelongsToExaminer = (doc, examinerIdentity) => {
  const app = getActiveInternApplication(doc.studentId);
  const e1 = doc.examinerName || app?.examinerName || "";
  const e2 = doc.examiner2Name || app?.examiner2Name || "";
  return (
    identityMatchesStaffField(e1, examinerIdentity) ||
    identityMatchesStaffField(e2, examinerIdentity)
  );
};

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
  const app = getActiveInternApplication(studentId);
  const all = getAllInternshipDocuments();
  const doc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    studentId: String(studentId ?? ""),
    studentName: studentName || "",
    title: (title || fileName || "Internship document").trim(),
    description: (description || "").trim(),
    fileName: fileName || "file",
    fileData,
    advisorName: (advisorName || app?.advisorName || "").trim(),
    examinerName: (examinerName || app?.examinerName || "").trim(),
    examiner2Name: (examiner2Name || app?.examiner2Name || "").trim(),
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

export const examinerCanReviewDocument = (doc, examinerIdentity) =>
  documentBelongsToExaminer(doc, examinerIdentity);

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
  const set = new Set(studentIds.map((x) => String(x)));
  return getAllInternshipDocuments().filter(
    (d) => set.has(String(d.studentId)) && documentBelongsToAdvisor(d, advisorIdentity)
  );
};

export const getDocumentsForExaminerStudents = (examinerIdentity, studentIds) => {
  const set = new Set(studentIds.map((x) => String(x)));
  return getAllInternshipDocuments().filter(
    (d) => set.has(String(d.studentId)) && documentBelongsToExaminer(d, examinerIdentity)
  );
};
