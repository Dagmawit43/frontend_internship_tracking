const WEEKLY_LOGBOOKS_KEY = "weeklyLogbooks";

export const WEEK_STATUS = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  PENDING_COMPANY: "PENDING_COMPANY",
  REJECTED_COMPANY: "REJECTED_COMPANY",
  PENDING_ADVISOR: "PENDING_ADVISOR",
  REJECTED_ADVISOR: "REJECTED_ADVISOR",
  APPROVED: "APPROVED",
};

export const STATUS_LABELS = {
  [WEEK_STATUS.NOT_SUBMITTED]: "Start Weekly Logbook",
  [WEEK_STATUS.PENDING_COMPANY]: "Pending Company Approval",
  [WEEK_STATUS.REJECTED_COMPANY]: "Rejected by Company - Edit Required",
  [WEEK_STATUS.PENDING_ADVISOR]: "Pending Advisor Approval",
  [WEEK_STATUS.REJECTED_ADVISOR]: "Rejected by Advisor - Edit Required",
  [WEEK_STATUS.APPROVED]: "Approved Successfully",
};

const editableStatuses = new Set([
  WEEK_STATUS.NOT_SUBMITTED,
  WEEK_STATUS.REJECTED_COMPANY,
  WEEK_STATUS.REJECTED_ADVISOR,
]);

export const canStudentEditWeek = (status) => editableStatuses.has(status);

export const createEmptyWeek = (weekNumber) => ({
  weekNumber,
  days: Array.from({ length: 6 }).map((_, index) => ({
    dayNumber: index + 1,
    workPerformed: "",
    supervisorComment: "",
  })),
  status: WEEK_STATUS.NOT_SUBMITTED,
  companyStatus: "PENDING",
  advisorStatus: "PENDING",
});

const normalize = (value) => String(value || "").trim();

const makeRecordId = ({ studentId, internshipId }) =>
  `${normalize(studentId)}::${normalize(internshipId)}`;

export const getWeeklyLogbooks = () => {
  try {
    return JSON.parse(localStorage.getItem(WEEKLY_LOGBOOKS_KEY) || "[]");
  } catch (error) {
    return [];
  }
};

export const saveWeeklyLogbooks = (records) => {
  localStorage.setItem(WEEKLY_LOGBOOKS_KEY, JSON.stringify(records));
};

export const ensureWeeklyLogbookForInternship = ({
  studentId,
  internshipId,
  companyId = "",
  advisorId = "",
}) => {
  const allRecords = getWeeklyLogbooks();
  const targetId = makeRecordId({ studentId, internshipId });
  const existing = allRecords.find((record) => record.recordId === targetId);
  if (existing) {
    const merged = {
      ...existing,
      studentId,
      internshipId,
      companyId: existing.companyId || companyId,
      advisorId: existing.advisorId || advisorId,
      meta: {
        studentName: existing?.meta?.studentName || "",
        companyName: existing?.meta?.companyName || "",
        supervisorName: existing?.meta?.supervisorName || "",
        safetyBrief: existing?.meta?.safetyBrief || "",
      },
      weeks:
        Array.isArray(existing.weeks) && existing.weeks.length === 8
          ? existing.weeks
          : Array.from({ length: 8 }).map((_, idx) => createEmptyWeek(idx + 1)),
    };
    const updated = allRecords.map((record) =>
      record.recordId === targetId ? merged : record
    );
    saveWeeklyLogbooks(updated);
    return merged;
  }

  const created = {
    recordId: targetId,
    studentId,
    internshipId,
    companyId,
    advisorId,
    meta: {
      studentName: "",
      companyName: "",
      supervisorName: "",
      safetyBrief: "",
    },
    weeks: Array.from({ length: 8 }).map((_, idx) => createEmptyWeek(idx + 1)),
  };
  saveWeeklyLogbooks([created, ...allRecords]);
  return created;
};

export const updateWeeklyLogbookMeta = (
  { studentId, internshipId, companyId = "", advisorId = "" },
  meta
) => {
  const current = ensureWeeklyLogbookForInternship({
    studentId,
    internshipId,
    companyId,
    advisorId,
  });
  const updatedRecord = {
    ...current,
    meta: {
      ...(current.meta || {}),
      ...(meta || {}),
    },
  };
  const allRecords = getWeeklyLogbooks();
  const updated = allRecords.map((record) =>
    record.recordId === current.recordId ? updatedRecord : record
  );
  saveWeeklyLogbooks(updated);
  return updatedRecord;
};

export const updateWeekForInternship = (
  { studentId, internshipId, companyId = "", advisorId = "" },
  weekNumber,
  updater
) => {
  const current = ensureWeeklyLogbookForInternship({
    studentId,
    internshipId,
    companyId,
    advisorId,
  });
  const nextWeeks = current.weeks.map((week) => {
    if (week.weekNumber !== weekNumber) return week;
    return updater(week);
  });

  const allRecords = getWeeklyLogbooks();
  const updatedRecord = {
    ...current,
    companyId: current.companyId || companyId,
    advisorId: current.advisorId || advisorId,
    weeks: nextWeeks,
  };
  const updated = allRecords.map((record) =>
    record.recordId === current.recordId ? updatedRecord : record
  );
  saveWeeklyLogbooks(updated);
  return updatedRecord;
};
