const WEEKLY_LOGBOOKS_KEY = "weeklyLogbooks";

export const LOGBOOK_UPDATED_EVENT = "weekly-logbook-updated";

export const notifyWeeklyLogbookUpdated = (detail = {}) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOGBOOK_UPDATED_EVENT, { detail }));
    window.dispatchEvent(new Event("storage"));
  }
};

const sameWeekNumber = (a, b) => Number(a) === Number(b);

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

/** Stable keys for localStorage records (student + internship). */
export const getLogbookScope = (appOrIntern) => ({
  studentId: normalize(appOrIntern?.studentId),
  internshipId: normalize(appOrIntern?.internshipId ?? appOrIntern?.id),
  companyId: normalize(appOrIntern?.companyId ?? appOrIntern?.companyName),
  advisorId: normalize(appOrIntern?.advisorName ?? appOrIntern?.advisorId),
});

/** Find the same logbook record student/company/advisor use (handles id vs internshipId). */
export const resolveLogbookScope = (appOrIntern) => {
  const sid = normalize(appOrIntern?.studentId);
  if (!sid) return getLogbookScope(appOrIntern);

  const allRecords = getWeeklyLogbooks();
  const candidates = [
    normalize(appOrIntern?.internshipId),
    normalize(appOrIntern?.id),
  ].filter(Boolean);

  for (const iid of candidates) {
    const targetId = makeRecordId({ studentId: sid, internshipId: iid });
    const hit = allRecords.find((r) => r.recordId === targetId);
    if (hit) {
      return {
        studentId: sid,
        internshipId: normalize(hit.internshipId) || iid,
        companyId: normalize(hit.companyId) || normalize(appOrIntern?.companyId ?? appOrIntern?.companyName),
        advisorId:
          normalize(hit.advisorId) ||
          normalize(appOrIntern?.advisorName ?? appOrIntern?.advisorId),
      };
    }
  }

  const byStudent = allRecords.find((r) => normalize(r.studentId) === sid);
  if (byStudent) {
    return {
      studentId: sid,
      internshipId: normalize(byStudent.internshipId),
      companyId: normalize(byStudent.companyId),
      advisorId: normalize(byStudent.advisorId),
    };
  }

  return getLogbookScope(appOrIntern);
};

export const getLogbookForApplication = (appOrIntern) =>
  ensureWeeklyLogbookForInternship(resolveLogbookScope(appOrIntern));

export const countPendingAdvisorWeeks = (appOrIntern) => {
  const rec = getLogbookForApplication(appOrIntern);
  return (rec.weeks || []).filter((w) => w.status === WEEK_STATUS.PENDING_ADVISOR).length;
};

const makeRecordId = ({ studentId, internshipId }) =>
  `${normalize(studentId)}::${normalize(internshipId)}`;

export const getWeeklyLogbooks = () => {
  try {
    return JSON.parse(localStorage.getItem(WEEKLY_LOGBOOKS_KEY) || "[]");
  } catch (error) {
    return [];
  }
};

/** Persist only — does not broadcast (avoids listener loops). */
const persistWeeklyLogbooks = (records) => {
  localStorage.setItem(WEEKLY_LOGBOOKS_KEY, JSON.stringify(records));
};

export const saveWeeklyLogbooks = (records, { notify = true } = {}) => {
  persistWeeklyLogbooks(records);
  if (notify) notifyWeeklyLogbookUpdated();
};

export const ensureWeeklyLogbookForInternship = ({
  studentId,
  internshipId,
  companyId = "",
  advisorId = "",
}) => {
  const sid = normalize(studentId);
  const iid = normalize(internshipId);
  if (!sid || !iid) {
    return {
      recordId: makeRecordId({ studentId: sid, internshipId: iid }),
      studentId: sid,
      internshipId: iid,
      companyId: normalize(companyId),
      advisorId: normalize(advisorId),
      meta: { studentName: "", companyName: "", supervisorName: "", safetyBrief: "" },
      weeks: Array.from({ length: 8 }).map((_, idx) => createEmptyWeek(idx + 1)),
    };
  }

  const allRecords = getWeeklyLogbooks();
  const targetId = makeRecordId({ studentId: sid, internshipId: iid });
  const existing = allRecords.find((record) => record.recordId === targetId);
  const cid = normalize(companyId);
  const aid = normalize(advisorId);

  if (existing) {
    const weeksOk = Array.isArray(existing.weeks) && existing.weeks.length === 8;
    if (weeksOk) {
      return {
        ...existing,
        studentId: sid,
        internshipId: iid,
        companyId: existing.companyId || cid,
        advisorId: existing.advisorId || aid,
      };
    }

    const merged = {
      ...existing,
      studentId: sid,
      internshipId: iid,
      companyId: existing.companyId || cid,
      advisorId: existing.advisorId || aid,
      meta: {
        studentName: existing?.meta?.studentName || "",
        companyName: existing?.meta?.companyName || "",
        supervisorName: existing?.meta?.supervisorName || "",
        safetyBrief: existing?.meta?.safetyBrief || "",
      },
      weeks: Array.from({ length: 8 }).map((_, idx) => createEmptyWeek(idx + 1)),
    };
    const updated = allRecords.map((record) =>
      record.recordId === targetId ? merged : record
    );
    persistWeeklyLogbooks(updated);
    return merged;
  }

  const created = {
    recordId: targetId,
    studentId: sid,
    internshipId: iid,
    companyId: cid,
    advisorId: aid,
    meta: {
      studentName: "",
      companyName: "",
      supervisorName: "",
      safetyBrief: "",
    },
    weeks: Array.from({ length: 8 }).map((_, idx) => createEmptyWeek(idx + 1)),
  };
  persistWeeklyLogbooks([created, ...allRecords]);
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
  saveWeeklyLogbooks(updated, { notify: false });
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
    if (!sameWeekNumber(week.weekNumber, weekNumber)) return week;
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

/** Meta + week update in one write/notify (student submit). */
export const submitWeekForInternship = (scope, weekNumber, { meta, days, status }) => {
  const scopeResolved = resolveLogbookScope({
    studentId: scope.studentId,
    internshipId: scope.internshipId,
    companyId: scope.companyId,
    advisorId: scope.advisorId,
  });
  const current = ensureWeeklyLogbookForInternship(scopeResolved);
  const nextWeeks = current.weeks.map((week) => {
    if (!sameWeekNumber(week.weekNumber, weekNumber)) return week;
    return {
      ...week,
      weekNumber: Number(weekNumber),
      days,
      status,
      companyStatus: "PENDING",
      advisorStatus: "PENDING",
      submittedAt: new Date().toISOString(),
    };
  });
  const updatedRecord = {
    ...current,
    companyId: current.companyId || normalize(scopeResolved.companyId),
    advisorId: current.advisorId || normalize(scopeResolved.advisorId),
    meta: { ...(current.meta || {}), ...(meta || {}) },
    weeks: nextWeeks,
  };
  const allRecords = getWeeklyLogbooks();
  const updated = allRecords.map((record) =>
    record.recordId === current.recordId ? updatedRecord : record
  );
  saveWeeklyLogbooks(updated);
  return updatedRecord;
};

/** Company approves or rejects a week → routes to advisor when approved. */
export const companyReviewWeek = (appOrIntern, weekNumber, action) => {
  const scope = resolveLogbookScope(appOrIntern);
  return updateWeekForInternship(scope, weekNumber, (week) => {
    if (week.status !== WEEK_STATUS.PENDING_COMPANY) return week;
    if (action === "approve") {
      return {
        ...week,
        companyStatus: "APPROVED",
        advisorStatus: "PENDING",
        status: WEEK_STATUS.PENDING_ADVISOR,
        companyReviewedAt: new Date().toISOString(),
      };
    }
    return {
      ...week,
      companyStatus: "REJECTED",
      status: WEEK_STATUS.REJECTED_COMPANY,
      companyReviewedAt: new Date().toISOString(),
    };
  });
};

/** Advisor finalizes a week after company approval. */
export const advisorFinalizeWeek = (appOrIntern, weekNumber, action) => {
  const scope = resolveLogbookScope(appOrIntern);
  return updateWeekForInternship(scope, weekNumber, (week) => {
    if (week.status !== WEEK_STATUS.PENDING_ADVISOR) return week;
    if (action === "approve") {
      return {
        ...week,
        advisorStatus: "APPROVED",
        status: WEEK_STATUS.APPROVED,
        advisorReviewedAt: new Date().toISOString(),
      };
    }
    return {
      ...week,
      advisorStatus: "REJECTED",
      status: WEEK_STATUS.REJECTED_ADVISOR,
      advisorReviewedAt: new Date().toISOString(),
    };
  });
};
