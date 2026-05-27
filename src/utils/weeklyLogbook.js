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
  return (rec.weeks || []).filter((w) =>
    w.status === WEEK_STATUS.PENDING_COMPANY || w.status === WEEK_STATUS.PENDING_ADVISOR
  ).length;
};

const makeRecordId = ({ studentId, internshipId }) =>
  `${normalize(studentId)}::${normalize(internshipId)}`;

export const getWeeklyLogbooks = () => {
  try {
    return JSON.parse(localStorage.getItem(WEEKLY_LOGBOOKS_KEY) || "[]");
  } catch {
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

// ─── API integration helpers ──────────────────────────────────────────────────
// Maps "studentId::internshipId::weekNumber" → backend logbook id
const LOGBOOK_API_IDS_KEY = "weeklyLogbookApiIds";

export const getLogbookApiId = (studentId, internshipId, weekNumber) => {
  try {
    const map = JSON.parse(localStorage.getItem(LOGBOOK_API_IDS_KEY) || "{}");
    return map[`${normalize(studentId)}::${normalize(internshipId)}::${weekNumber}`] || null;
  } catch {
    return null;
  }
};

export const setLogbookApiId = (studentId, internshipId, weekNumber, apiId) => {
  try {
    const map = JSON.parse(localStorage.getItem(LOGBOOK_API_IDS_KEY) || "{}");
    map[`${normalize(studentId)}::${normalize(internshipId)}::${weekNumber}`] = apiId;
    localStorage.setItem(LOGBOOK_API_IDS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

/**
 * Map backend WeeklyLogbook status → frontend WEEK_STATUS
 */
export const backendStatusToFrontend = (backendStatus) => {
  switch (String(backendStatus || "").toUpperCase()) {
    case "DRAFT":       return WEEK_STATUS.NOT_SUBMITTED;
    case "SUBMITTED":   return WEEK_STATUS.PENDING_COMPANY;
    case "VERIFIED":    return WEEK_STATUS.PENDING_ADVISOR;
    case "REVIEWED":    return WEEK_STATUS.APPROVED;
    default:            return WEEK_STATUS.NOT_SUBMITTED;
  }
};

/**
 * Convert a single backend WeeklyLogbook record (from /logbooks/advisor/ or
 * /logbooks/company/) into the shape InternshipLogbookForm expects.
 *
 * Backend shape:
 *   { id, week_number, status, student_full_name, student_id, company_name,
 *     submitted_at, company_comment, advisor_comment, daily_log_entries: [
 *       { id, day_number, work_date, work_performed }
 *     ] }
 *
 * Frontend week shape:
 *   { weekNumber, status (WEEK_STATUS), days: [{ dayNumber, workPerformed, supervisorComment }],
 *     apiId, companyComment, advisorComment, submittedAt }
 */
export const apiLogbookToWeek = (apiLogbook) => {
  const days = (apiLogbook.daily_log_entries || apiLogbook.daily_entries || [])
    .sort((a, b) => a.day_number - b.day_number)
    .map((entry) => ({
      dayNumber: entry.day_number,
      workPerformed: entry.work_performed || "",
      supervisorComment: entry.supervisor_comment || "",
    }));

  // Pad to 6 days if fewer entries exist
  while (days.length < 6) {
    days.push({ dayNumber: days.length + 1, workPerformed: "", supervisorComment: "" });
  }

  return {
    weekNumber: apiLogbook.week_number,
    status: backendStatusToFrontend(apiLogbook.status),
    apiId: apiLogbook.id,
    apiStatus: apiLogbook.status,   // raw backend status for submit/verify/review calls
    companyComment: apiLogbook.company_comment || "",
    advisorComment: apiLogbook.advisor_comment || "",
    submittedAt: apiLogbook.submitted_at || null,
    days,
    // keep legacy fields so existing code doesn't break
    companyStatus: apiLogbook.status === "VERIFIED" || apiLogbook.status === "REVIEWED" ? "APPROVED" : "PENDING",
    advisorStatus: apiLogbook.status === "REVIEWED" ? "APPROVED" : "PENDING",
  };
};

/**
 * Group a flat array of backend logbook records by internship student.
 * Returns a Map: studentId → { studentName, companyName, weeks[] }
 */
export const groupApiLogbooksByStudent = (apiLogbooks) => {
  const map = new Map();
  for (const lb of apiLogbooks) {
    const sid = lb.student_id || "";
    if (!map.has(sid)) {
      map.set(sid, {
        studentId: sid,
        internshipId: lb.internship_id || lb.internship || "",
        studentName: lb.student_full_name || "",
        companyName: lb.company_name || "",
        meta: { studentName: lb.student_full_name || "", companyName: lb.company_name || "", supervisorName: "", safetyBrief: "" },
        weeks: [],
      });
    }
    map.get(sid).weeks.push(apiLogbookToWeek(lb));
  }
  // Sort weeks by weekNumber within each student
  for (const rec of map.values()) {
    rec.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  }
  return map;
};

/**
 * Sync backend logbooks into the localStorage format used by the dashboards.
 * Keeps existing manual records that do not match API-backed student/internship pairs.
 */
export const syncWeeklyLogbooksFromApi = (apiLogbooks, { merge = true } = {}) => {
  const grouped = groupApiLogbooksByStudent(Array.isArray(apiLogbooks) ? apiLogbooks : []);
  const existing = getWeeklyLogbooks();
  const apiRecords = [];

  for (const rec of grouped.values()) {
    const studentId = String(rec.studentId || "").trim();
    const internshipId = String(rec.internshipId || "").trim();
    if (!studentId || !internshipId) continue;

    const weeks = (rec.weeks || []).map((week) => ({
      ...week,
      companyStatus: week.companyStatus || "PENDING",
      advisorStatus: week.advisorStatus || "PENDING",
    }));

    const record = {
      recordId: `${studentId}::${internshipId}`,
      studentId,
      internshipId,
      companyId: "",
      advisorId: "",
      meta: {
        studentName: rec.studentName || "",
        companyName: rec.companyName || "",
        supervisorName: "",
        safetyBrief: "",
      },
      weeks,
    };

    apiRecords.push(record);

    for (const week of weeks) {
      if (week.apiId) {
        setLogbookApiId(studentId, internshipId, week.weekNumber, week.apiId);
      }
    }
  }

  const merged = merge
    ? [
        ...existing.filter((record) => !apiRecords.some((next) => next.recordId === record.recordId)),
        ...apiRecords,
      ]
    : apiRecords;

  saveWeeklyLogbooks(merged);
  return merged;
};
