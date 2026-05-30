import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  BookOpen,
  Building2,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import AdvisorSidebar from "./AdvisorSidebar";
import { useAuth } from "../contexts/AuthContext";
import storageService from "../services/storageService";
import api from "../api";
import internshipService from "../services/internshipService";
import evaluationService from "../services/evaluationService";
import InternshipLogbookForm from "./InternshipLogbookForm";
import InternshipMonthlyEvaluation from "./InternshipMonthlyEvaluation";
import InternshipEvaluationForm from "./InternshipEvaluationForm";
import AdvisorStudentEvaluationForm from "./AdvisorStudentEvaluationForm";
import LoadingState from "./LoadingState";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  advisorFinalizeWeek,
  countPendingAdvisorWeeks,
  getLogbookForApplication,
  getLogbookApiId,
  groupApiLogbooksByStudent,
  syncWeeklyLogbooksFromApi,
} from "../utils/weeklyLogbook";
import {
  EVAL_STATUS,
  EVAL_STATUS_LABELS,
  getAllEvaluations,
  getEvaluation,
  advisorDecideEvaluation,
} from "../utils/monthlyEvaluations";
import {
  FINAL_EVAL_STATUS,
  FINAL_EVAL_STATUS_LABELS,
  getAllFinalEvaluations,
  getFinalEvaluation,
  advisorDecideFinalEvaluation,
} from "../utils/finalEvaluations";
import {
  getDocumentsByInternshipId,
  advisorDecideInternshipDocument,
  ROLE_DOC_STATUS,
  syncInternshipDocumentsFromApi,
} from "../utils/internshipDocuments";
import {
  getAdvisorEvaluation,
  submitAdvisorEvaluation,
  ADVISOR_EVAL_STATUS,
} from "../utils/advisorEvaluations";
import { getExaminerEvaluationForAdvisorSlot } from "../utils/examinerEvaluations";
import ExaminerUniversityEvaluationForm from "./ExaminerUniversityEvaluationForm";
import {
  computeOverallEvaluation,
  getOverallApprovals,
  approveOverallAsAdvisor,
} from "../utils/overallEvaluation";

const readAdvisorProfile = () => {
  try {
    const rawAdvisor = localStorage.getItem("advisor");
    if (rawAdvisor && rawAdvisor !== "null" && rawAdvisor !== "undefined") {
      const p = JSON.parse(rawAdvisor);
      if (p && typeof p === "object" && (p.fullName || p.name || p.username || p.email || p.department)) {
        return p;
      }
    }
    for (const key of ["activeStaffUser", "user"]) {
      const raw = localStorage.getItem(key);
      if (!raw || raw === "null" || raw === "undefined") continue;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") continue;
      const role = String(p.role || p.role_name || p.user_type || p.accountType || "").toLowerCase();
      console.log(`readAdvisorProfile: key=${key}, role=${role}, hasIdFields=${!!(p.fullName || p.name || p.username || p.email || p.department)}`);
      if (role !== "advisor") continue;
      if (p.fullName || p.name || p.username || p.email || p.department) return p;
    }
  } catch (e) {
    console.error("readAdvisorProfile error:", e);
  }
  console.log("readAdvisorProfile: returning null");
  return null;
};

// Compute weighted total (0-100) from form_data where fields are 0-20.
const computeWeightedTotalFromForm = (form) => {
  if (!form || typeof form !== 'object') return null;
  // use same weights as the evaluation form
  const FIELD_WEIGHTS = {
    punctuality: 5, reliability: 5, independence: 5, communication: 5, professionalism: 5,
    speedOfWork: 5, accuracy: 5, engagement: 5, workNeed: 5, cooperation: 5,
    technicalSkills: 5, organizationalSkills: 5, projectSupport: 5, responsibility: 15, teamwork: 20,
  };
  let total = 0;
  let any = false;
  for (const key of Object.keys(FIELD_WEIGHTS)) {
    const raw = Number(form[key] ?? form[key === 'speedOfWork' ? 'speedOfWork' : key] ?? 0);
    if (!isNaN(raw) && raw !== 0) any = true;
    const clamped = Math.max(0, Math.min(20, isNaN(raw) ? 0 : raw));
    const weight = FIELD_WEIGHTS[key] || 0;
    total += (clamped / 20) * weight;
  }
  if (!any) return null;
  return Math.round(total * 100) / 100;
};

const AdvisorStudentDocumentsPanel = ({ studentId, internshipId }) => {
  const [docs, setDocs] = useState([]);
  const [commentByDoc, setCommentByDoc] = useState({});

  const reload = useCallback(() => {
    const list = getDocumentsByInternshipId(internshipId || studentId);
    setDocs(list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  }, [internshipId, studentId]);

  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, [reload]);

  const decide = async (docId, action) => {
    const comment = commentByDoc[docId] || "";
    const doc = docs.find((d) => d.id === docId);
    // Prefer API-backed document if available
    if (doc && doc.apiId) {
      try {
        const res = await internshipService.advisorReviewDocument(doc.apiId, action, comment);
        if (res.success && res.data) {
          // sync the returned item into local store
          syncInternshipDocumentsFromApi([res.data], { merge: true });
          reload();
          return;
        }
      } catch {
        // fallthrough to local update
      }
    }

    // Fallback: local-only update
    advisorDecideInternshipDocument(docId, action, comment);
    reload();
  };

  if (docs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No internship documents from this student for you to review yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Review files the student uploaded. Your decision is independent of the internal examiner&apos;s.
      </p>
      {docs.map((doc) => {
        const pending = doc.advisorStatus === ROLE_DOC_STATUS.PENDING;
        return (
          <div key={doc.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-gray-50/40 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 items-start">
              <div>
                <h4 className="font-bold text-gray-900">{doc.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(doc.submittedAt).toLocaleString()} · Examiner: {doc.examinerStatus}
                </p>
                {doc.description && <p className="text-sm text-gray-600 mt-2">{doc.description}</p>}
              </div>
              <a
                href={doc.fileData}
                download={doc.fileName}
                className="text-sm font-bold text-indigo-600 hover:underline shrink-0"
              >
                Download
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border bg-white text-gray-700 border-gray-200">
                Your status: {doc.advisorStatus}
              </span>
            </div>
            {pending ? (
              <div className="pt-2 space-y-2 border-t border-gray-100">
                <textarea
                  value={commentByDoc[doc.id] || ""}
                  onChange={(e) => setCommentByDoc((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  placeholder="Optional comment for the student"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => decide(doc.id, "approve")}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(doc.id, "reject")}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 pt-1">
                {doc.advisorComment && <span className="block"><strong>Your comment:</strong> {doc.advisorComment}</span>}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StaffTopNavigation = ({ displayName, roleLabel, notificationCount = 0 }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      logout();
    } catch {
      /* ignore */
    }
    navigate("/login");
  };

  return (
    <nav className="app-nav shrink-0 border-b border-slate-200/80">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoSrc}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200/80"
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">Internship Tracking System</h1>
            <p className="text-xs text-slate-500">AASTU</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <button
              type="button"
              className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 sm:px-4"
          >
            <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex min-w-0 max-w-[160px] items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors sm:max-w-none sm:px-3"
            >
              <span className="truncate text-sm font-medium text-gray-700">{displayName || roleLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            </button>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-gray-200 px-4 py-1">
                    <p className="text-sm font-medium text-gray-900">{displayName || roleLabel}</p>
                    <p className="text-xs text-gray-500">{roleLabel} Account</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const StaffWelcomeHeader = ({ name, department, roleLabel, subtitle, statPrimary, statSecondary }) => (
  <div className="app-hero">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {name || roleLabel}</h1>
        <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-95">
          {department && (
            <div className="flex items-center gap-2">
              <span className="opacity-90">Department:</span>
              <span className="font-semibold">{department}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="opacity-90">Role:</span>
            <span className="font-semibold">{roleLabel}</span>
          </div>
        </div>
        {subtitle && <p className="mt-3 max-w-xl text-sm text-indigo-100/95">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20">
          <ClipboardList className="w-6 h-6" />
          <div>
            <p className="text-xs font-medium opacity-80">Active interns</p>
            <p className="text-lg font-bold">{statPrimary ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20">
          <Clock className="w-6 h-6" />
          <div>
            <p className="text-xs font-medium opacity-80">Pending logbook weeks</p>
            <p className="text-lg font-bold">{statSecondary ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdvisorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [assignedStudentsLoading, setAssignedStudentsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [studentDetailTab, setStudentDetailTab] = useState("logbook");

  // Monthly evaluations state
  const [monthlyEvals, setMonthlyEvals] = useState([]);
  const [monthlyEvalsLoading, setMonthlyEvalsLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null); // { eval, studentApp }
  
  // Final evaluations state
  const [finalEvals, setFinalEvals] = useState([]);
  const [finalEvalsLoading, setFinalEvalsLoading] = useState(true);
  const [selectedFinalEval, setSelectedFinalEval] = useState(null); // { eval, studentApp }
  const [selectedDocQueue, setSelectedDocQueue] = useState(null); // { doc, studentApp }
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [internshipDocsNonce, setInternshipDocsNonce] = useState(0);
  const [advisorEvalNonce, setAdvisorEvalNonce] = useState(0);
  const [advisorEvalApiRecord, setAdvisorEvalApiRecord] = useState(null);
  const [advisorEvalLoading, setAdvisorEvalLoading] = useState(true);
  const [examinerEvalNonce, setExaminerEvalNonce] = useState(0);
  const [examinerEvalsLoading, setExaminerEvalsLoading] = useState(true);
  const [docQueueComment, setDocQueueComment] = useState("");
  const [logbookNonce, setLogbookNonce] = useState(0);
  const [logbookQueueLoading, setLogbookQueueLoading] = useState(true);
  const [overallNonce, setOverallNonce] = useState(0);
  const [overallQueueLoading, setOverallQueueLoading] = useState(true);
  const [focusLogbookWeek, setFocusLogbookWeek] = useState(null);
  // API-fetched examiner evaluations keyed by internship id
  const [apiExaminerEvals, setApiExaminerEvals] = useState({});
  // API-fetched company monthly evaluations keyed by internship id, then month number
  const [apiMonthlyEvals, setApiMonthlyEvals] = useState({});
  // API-fetched logbooks keyed by internship id (application PK)
  const [apiLogbooksMap, setApiLogbooksMap] = useState({});
  // API-fetched company final evaluations keyed by internship (application) PK
  const [apiFinalEvals, setApiFinalEvals] = useState({});
  // API-fetched overall evaluation keyed by internship (application) PK
  const [apiOverallEval, setApiOverallEval] = useState(null);

  const refreshMonthlyEvals = () => setMonthlyEvals(getAllEvaluations());
  const refreshFinalEvals = () => setFinalEvals(getAllFinalEvaluations());

  useEffect(() => {
    const stateUser = location?.state?.user;
    const activeSession = stateUser || readAdvisorProfile();
    if (!activeSession) {
      navigate("/login");
      return;
    }
    // Normalize role to title case so permission checks are consistent
    const normalized = { ...activeSession, role: "Advisor" };
    if (stateUser) {
      localStorage.setItem("user", JSON.stringify(normalized));
      localStorage.setItem("advisor", JSON.stringify(normalized));
    }
    setSession(normalized);
  }, [location, navigate]);

  const advisorIdentity = useMemo(() => {
    const name = session?.fullName || session?.name || session?.username || "";
    return String(name || "").trim().toLowerCase();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setAssignedStudentsLoading(true);
    let cancelled = false;
    const loadAssigned = async () => {
      try {
        // Primary: fetch from API endpoint — auth token identifies the advisor
        const res = await api.get("/advisor/my-students/");
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.results || res.data || [];
        const mapped = items.map((app) => ({
          id: app.id,
          studentName: app.student_name || app.form_snapshot?.student?.name || "",
          studentId: app.form_snapshot?.student?.student_id || app.student_id || "",
          studentUserPk: app.student_user_id || null,
          companyName: app.company_name || app.form_snapshot?.company?.name || "",
          positionTitle: app.position_title || "",
          advisorName: app.advisor_name || "",
          examinerName: app.examiner_name || app.examinerName || "",
          examiner2Name: app.examiner2_name || app.examiner2Name || "",
          department: app.form_snapshot?.student?.department_name || app.form_snapshot?.student?.department || "",
          finalInternshipStatus: "ACTIVE_INTERN",
          __raw: app,
        }));
        setAssignedStudents(mapped);
      } catch (apiErr) {
        // Fallback: filter from localStorage by advisor name
        console.warn("API /advisor/my-students/ failed, falling back to localStorage:", apiErr.message);
        try {
          const allApps = await storageService.getApplications();
          const active = allApps.filter((app) => {
            if (app.finalInternshipStatus !== "ACTIVE_INTERN") return false;
            const assignedAdvisor = String(app.advisorName || "").trim().toLowerCase();
            if (assignedAdvisor && assignedAdvisor === advisorIdentity) return true;
            const rec = getLogbookForApplication(app);
            const onRecord = String(rec.advisorId || "").trim().toLowerCase();
            return onRecord && onRecord === advisorIdentity;
          });
          setAssignedStudents(active);
        } catch (err) {
          console.error("Failed to load assigned students:", err);
          setAssignedStudents([]);
        }
      } finally {
        if (!cancelled) setAssignedStudentsLoading(false);
      }
    };
    loadAssigned();
    const interval = setInterval(loadAssigned, 30000);
    window.addEventListener("weekly-logbook-updated", loadAssigned);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("weekly-logbook-updated", loadAssigned);
    };
  }, [session]);

  // Fetch examiner evaluations from API so advisor can see them without localStorage
  useEffect(() => {
    if (!session) return;
    setExaminerEvalsLoading(true);
    const fetchExaminerEvals = async () => {
      try {
        const res = await evaluationService.getExaminerEvaluationsForAdvisor();
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          const map = {};
          items.forEach((item) => {
            if (!map[item.internship]) map[item.internship] = [];
            map[item.internship].push({
              id: item.id,
              internshipId: item.internship,
              studentId: item.student_id,
              examinerName: item.examiner_name,
              formData: item.form_data || {},
              status: "SUBMITTED",
              submittedAt: item.submitted_at,
              totalScore: item.total_score,
              weightedScore: item.weighted_score,
            });
          });
          setApiExaminerEvals(map);
        }
      } catch (err) {
        console.warn("Examiner eval fetch failed:", err?.message);
      } finally {
        setExaminerEvalsLoading(false);
      }
    };
    fetchExaminerEvals();
  }, [session, examinerEvalNonce]);

  // Fetch company monthly evaluations from API for advisor's students
  useEffect(() => {
    if (!session) return;
    setMonthlyEvalsLoading(true);
    const fetchMonthlyEvals = async () => {
      try {
        // GET /api/evaluations/monthly/ — advisor-accessible endpoint
        const res = await evaluationService.getAdvisorMonthlyEvaluations();
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          // Key by internship (application) PK → month_number → eval object
          const map = {};
          items.forEach((item) => {
            if (!map[item.internship]) map[item.internship] = {};
            map[item.internship][item.month_number] = item;
          });
          setApiMonthlyEvals(map);
        }
      } catch (err) {
        console.warn("Monthly eval fetch failed:", err?.message);
      } finally {
        setMonthlyEvalsLoading(false);
      }
    };
    fetchMonthlyEvals();
    const onMonthly = () => fetchMonthlyEvals();
    window.addEventListener("monthly-evaluation-updated", onMonthly);
    return () => window.removeEventListener("monthly-evaluation-updated", onMonthly);
  }, [session]);

  // Fetch company final evaluations from API for advisor's students
  useEffect(() => {
    if (!session) return;
    setFinalEvalsLoading(true);
    const fetchFinalEvals = async () => {
      try {
        // GET /api/evaluations/final/ — advisor-accessible endpoint
        const res = await evaluationService.getAdvisorFinalEvaluations();
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          // Key by internship execution record PK → eval object
          // We also need to map back to application PK via student
          const map = {};
          items.forEach((item) => {
            // item.internship is the Internship (execution) PK
            // item.student_id is the student's student_id string
            // Store by student_id for easy lookup
            if (item.student_id) map[item.student_id] = item;
          });
          setApiFinalEvals(map);
        }
      } catch (err) {
        console.warn("Final eval fetch failed:", err?.message);
      } finally {
        setFinalEvalsLoading(false);
      }
    };
    fetchFinalEvals();
    const onFinal = () => fetchFinalEvals();
    window.addEventListener("final-evaluation-updated", onFinal);
    return () => window.removeEventListener("final-evaluation-updated", onFinal);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLogbookQueueLoading(true);

    const syncAdvisorLogbooks = async () => {
      try {
        const res = await internshipService.getAdvisorLogbooks();
        if (!res.success || cancelled) return;
        const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (items.length > 0) {
          syncWeeklyLogbooksFromApi(items, { merge: true });
          // Build map keyed by internship_id for direct lookup
          const map = {};
          const grouped = groupApiLogbooksByStudent(items);
          for (const rec of grouped.values()) {
            const iid = String(rec.internshipId || "");
            if (iid) map[iid] = rec;
          }
          if (!cancelled) setApiLogbooksMap(map);
        }
      } catch (err) {
        console.warn("Advisor logbook sync failed:", err?.message || err);
      } finally {
        if (!cancelled) setLogbookQueueLoading(false);
      }
    };

    syncAdvisorLogbooks();
    const interval = setInterval(syncAdvisorLogbooks, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setDocumentsLoading(true);

    const syncAdvisorDocuments = async () => {
      const res = await internshipService.getAdvisorDocuments();
      if (!res.success || cancelled) return;
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];
      syncInternshipDocumentsFromApi(items, { merge: true });
      if (!cancelled) setDocumentsLoading(false);
    };

    syncAdvisorDocuments();
    const interval = setInterval(syncAdvisorDocuments, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session, assignedStudents.length]);

  // Load monthly evals whenever assigned students change or storage updates
  useEffect(() => {
    refreshMonthlyEvals();
    refreshFinalEvals();
    setMonthlyEvalsLoading(false);
    setFinalEvalsLoading(false);
    window.addEventListener("storage", refreshMonthlyEvals);
    window.addEventListener("storage", refreshFinalEvals);
    return () => {
      window.removeEventListener("storage", refreshMonthlyEvals);
      window.removeEventListener("storage", refreshFinalEvals);
    };
  }, []);

  useEffect(() => {
    const bump = () => {
      setInternshipDocsNonce((n) => n + 1);
      setAdvisorEvalNonce((n) => n + 1);
      setExaminerEvalNonce((n) => n + 1);
      setOverallNonce((n) => n + 1);
    };
    window.addEventListener("overall-evaluation-updated", bump);
    return () => {
      window.removeEventListener("overall-evaluation-updated", bump);
    };
  }, []);

  useEffect(() => {
    const bumpExaminer = () => setExaminerEvalNonce((n) => n + 1);
    window.addEventListener("examiner-evaluation-updated", bumpExaminer);
    return () => window.removeEventListener("examiner-evaluation-updated", bumpExaminer);
  }, []);

  useEffect(() => {
    const bumpLogbook = () => setLogbookNonce((n) => n + 1);
    window.addEventListener("weekly-logbook-updated", bumpLogbook);
    return () => {
      window.removeEventListener("weekly-logbook-updated", bumpLogbook);
    };
  }, []);

  useEffect(() => {
    if (!selectedStudent?.id && !selectedStudent?.studentId) return;

    const fetchLogbook = async () => {
      setLogbookLoading(true);
      try {
        const internshipId = selectedStudent?.id || selectedStudent?.__raw?.id || selectedStudent?.internshipId;
        const params = internshipId ? { internship_id: internshipId } : {};
        const res = await internshipService.getAdvisorLogbooks(params);
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          if (items.length > 0) {
            const grouped = groupApiLogbooksByStudent(items);
            const sid = String(selectedStudent.studentId || "").trim();
            const rec = grouped.get(sid) || grouped.values().next().value;
            if (rec) {
              setSelectedLogbook(rec);
              // Update the map so pendingLogbookQueue reflects latest data
              if (internshipId) {
                setApiLogbooksMap((prev) => ({ ...prev, [String(internshipId)]: rec }));
              }
              setLogbookLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch logbook from API, falling back to localStorage:", err.message);
      }
      // Fallback to localStorage
      setSelectedLogbook(getLogbookForApplication(selectedStudent));
      setLogbookLoading(false);
    };

    fetchLogbook();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.id, selectedStudent?.studentId]);

  const pendingWeeksCount = useMemo(() => {
    // Prefer API data
    if (Object.keys(apiLogbooksMap).length > 0) {
      let n = 0;
      for (const rec of Object.values(apiLogbooksMap)) {
        n += (rec.weeks || []).filter(
          (w) => w.status === WEEK_STATUS.PENDING_ADVISOR
        ).length;
      }
      return n;
    }
    let n = 0;
    for (const app of assignedStudents) {
      n += countPendingAdvisorWeeks(app);
    }
    return n;
  }, [assignedStudents, logbookNonce, apiLogbooksMap]);

  const pendingLogbookQueue = useMemo(() => {
    // Prefer API data
    if (Object.keys(apiLogbooksMap).length > 0) {
      const items = [];
      for (const app of assignedStudents) {
        const iid = String(app.id || "");
        const rec = apiLogbooksMap[iid];
        if (!rec) continue;
        for (const week of rec.weeks || []) {
          if (week.status === WEEK_STATUS.PENDING_ADVISOR) {
            items.push({ app, week, record: rec });
          }
        }
      }
      return items.sort((a, b) => Number(a.week.weekNumber) - Number(b.week.weekNumber));
    }
    // Fallback to localStorage
    const items = [];
    for (const app of assignedStudents) {
      const rec = getLogbookForApplication(app);
      for (const week of rec.weeks || []) {
        if (week.status === WEEK_STATUS.PENDING_COMPANY || week.status === WEEK_STATUS.PENDING_ADVISOR) {
          items.push({ app, week, record: rec });
        }
      }
    }
    return items.sort(
      (a, b) => Number(a.week.weekNumber) - Number(b.week.weekNumber)
    );
  }, [assignedStudents, logbookNonce, apiLogbooksMap]);

  // Monthly evals submitted to this advisor (matched by advisorName or studentId fallback)
  const pendingMonthlyEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    const appIds = new Set(assignedStudents.map(a => String(a.id)));

    // Build from API data first
    const apiItems = [];
    Object.entries(apiMonthlyEvals).forEach(([internshipId, byMonth]) => {
      if (!appIds.has(String(internshipId))) return;
      const studentApp = assignedStudents.find(a => String(a.id) === String(internshipId));
      Object.values(byMonth).forEach((item) => {
        if (item.status === "SUBMITTED") {
          apiItems.push({
            id: `api-monthly-${item.id}`,
            apiId: item.id,
            studentId: studentApp?.studentId || "",
            month: item.month_number,
            status: EVAL_STATUS.SUBMITTED,
            advisorComment: item.advisor_comment || "",
            submittedAt: item.submitted_at,
            evaluationData: (function() {
              const form = item.form_data || {};
              const computed = computeWeightedTotalFromForm(form);
              const total = computed !== null ? computed : (item.form_data?.totalMarks ?? item.total_score);
              const perf = form?.monthlyPerformance ?? (total ? ((total / 100) * 20) : null);
              return { ...(form || {}), totalMarks: total, monthlyPerformance: perf };
            })(),
          });
        }
      });
    });

    if (apiItems.length > 0) return apiItems;

    // Fall back to localStorage
    return monthlyEvals.filter(e => {
      const byAdvisor = String(e.advisorName || "").trim().toLowerCase() === advisorIdentity;
      const byStudent = studentIds.has(e.studentId);
      return (byAdvisor || byStudent) && e.status === EVAL_STATUS.SUBMITTED;
    });
  }, [monthlyEvals, assignedStudents, advisorIdentity, apiMonthlyEvals]);

  // All evals for this advisor's students (any status) — for the full list view
  const allMyMonthlyEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    const appIds = new Set(assignedStudents.map(a => String(a.id)));

    // Build from API data first
    const apiItems = [];
    Object.entries(apiMonthlyEvals).forEach(([internshipId, byMonth]) => {
      if (!appIds.has(String(internshipId))) return;
      const studentApp = assignedStudents.find(a => String(a.id) === String(internshipId));
      Object.values(byMonth).forEach((item) => {
        const status = item.status === "ADVISOR_APPROVED" ? EVAL_STATUS.APPROVED
                     : item.status === "REJECTED" ? EVAL_STATUS.REJECTED
                     : EVAL_STATUS.SUBMITTED;
        apiItems.push({
          id: `api-monthly-${item.id}`,
          apiId: item.id,
          studentId: studentApp?.studentId || "",
          month: item.month_number,
          status,
          advisorComment: item.advisor_comment || "",
          submittedAt: item.submitted_at,
          evaluationData: (function() {
            const form = item.form_data || {};
            const computed = computeWeightedTotalFromForm(form);
            const total = computed !== null ? computed : (item.form_data?.totalMarks ?? item.total_score);
            const perf = form?.monthlyPerformance ?? (total ? ((total / 100) * 20) : null);
            return { ...(form || {}), totalMarks: total, monthlyPerformance: perf };
          })(),
        });
      });
    });

    if (apiItems.length > 0) return apiItems;

    // Fall back to localStorage
    return monthlyEvals.filter(e => {
      const byAdvisor = String(e.advisorName || "").trim().toLowerCase() === advisorIdentity;
      const byStudent = studentIds.has(e.studentId);
      return byAdvisor || byStudent;
    });
  }, [monthlyEvals, assignedStudents, advisorIdentity, apiMonthlyEvals]);

  // Final evaluations pending advisor approval — prefer API data
  const pendingFinalEvals = useMemo(() => {
    // Build from API data first
    const apiItems = Object.entries(apiFinalEvals)
      .filter(([, item]) => {
        const status = String(item?.status || "").toUpperCase();
        return ["SUBMITTED", "PENDING", "PENDING_ADVISOR", "PENDING_ADVISOR_APPROVAL"].includes(status);
      })
      .map(([studentId, item]) => {
        const studentApp = assignedStudents.find(a => a.studentId === studentId);
        return {
          id: `api-final-${item.id}`,
          apiId: item.id,
          studentId,
          studentName: item.student_full_name || studentApp?.studentName || "",
          companyName: item.company_name || studentApp?.companyName || "",
          status: FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL,
          formData: item.form_data || {},
          total: item.total_mark,
          finalMark: Number(item.overall_student_performance ?? 0),
          advisorComment: "",
          examinerComment: "",
          submittedAt: item.submitted_at,
        };
      });

    if (apiItems.length > 0) return apiItems;

    // Fall back to localStorage
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    return finalEvals.filter(e => {
      const byStudent = studentIds.has(e.studentId);
      return byStudent && e.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL;
    });
  }, [finalEvals, assignedStudents, apiFinalEvals]);

  // All final evaluations for this advisor's students
  const allMyFinalEvals = useMemo(() => {
    const apiItems = Object.entries(apiFinalEvals)
      .filter(([studentId]) => assignedStudents.some((a) => a.studentId === studentId || String(a.id) === String(studentId)))
      .map(([studentId, item]) => {
        const studentApp = assignedStudents.find((a) => a.studentId === studentId);
        const status = String(item?.status || "").toUpperCase();
        return {
          id: `api-final-${item.id}`,
          apiId: item.id,
          studentId,
          studentName: item.student_full_name || studentApp?.studentName || "",
          companyName: item.company_name || studentApp?.companyName || "",
          status:
            status === "ADVISOR_APPROVED"
              ? FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR
              : status === "PENDING_EXAMINER_APPROVAL"
                ? FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL
                : status === "FINAL_APPROVED"
                  ? FINAL_EVAL_STATUS.FINAL_APPROVED
                  : status === "REJECTED"
                    ? FINAL_EVAL_STATUS.REJECTED
                    : FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL,
          formData: item.form_data || {},
          total: item.total_mark,
          finalMark: Number(item.overall_student_performance ?? 0),
          advisorComment: item.advisor_comment || "",
          examinerComment: item.examiner_comment || "",
          submittedAt: item.submitted_at,
        };
      });

    if (apiItems.length > 0) return apiItems;

    const studentIds = new Set(assignedStudents.map((a) => a.studentId));
    return finalEvals.filter((e) => studentIds.has(e.studentId));
  }, [finalEvals, assignedStudents, apiFinalEvals]);

  const pendingAdvisorDocuments = useMemo(() => {
    return assignedStudents
      .flatMap((app) => getDocumentsByInternshipId(app.id))
      .filter((d) => [ROLE_DOC_STATUS.PENDING].includes(d.advisorStatus))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [assignedStudents, internshipDocsNonce]);

  const pendingOverallQueue = useMemo(
    () =>
      assignedStudents
        .map((app) => {
          const approvals = getOverallApprovals(app.studentId);
          if (approvals.advisorApproved) return null;
          const overall = computeOverallEvaluation(app);
          if (!overall.complete) return null;
          return { app, overall, approvals };
        })
        .filter(Boolean),
    [assignedStudents, advisorEvalNonce, examinerEvalNonce, overallNonce]
  );

  useEffect(() => {
    setOverallQueueLoading(
      assignedStudentsLoading || finalEvalsLoading || examinerEvalsLoading || advisorEvalLoading
    );
  }, [assignedStudentsLoading, finalEvalsLoading, examinerEvalsLoading, advisorEvalLoading]);

  const selectedAdvisorEval = useMemo(() => {
    if (!selectedStudent) return null;
    return advisorEvalApiRecord;
  }, [selectedStudent, advisorEvalApiRecord]);

  // Load advisor evaluation from API whenever the selected student changes
  useEffect(() => {
    setAdvisorEvalApiRecord(null);
    setApiOverallEval(null);
    if (!selectedStudent?.id) {
      setAdvisorEvalLoading(false);
      return;
    }
    let cancelled = false;
    setAdvisorEvalLoading(true);
    (async () => {
      // Fetch advisor evaluation
      try {
        const res = await evaluationService.getAdvisorEvaluationForInternship(selectedStudent.id);
        if (res.success && res.data && !cancelled) {
          const d = res.data;
          // Scale DB values back up to the frontend's display range
          const unscale = (dbVal, dbMax, frontendMax) =>
            dbMax === 0 ? 0 : Math.round((dbVal ?? 0) / dbMax * frontendMax);
          setAdvisorEvalApiRecord({
            status: ADVISOR_EVAL_STATUS.SUBMITTED,
            submittedAt: d.submitted_at,
            advisorName: d.advisor_name || "",
            apiId: d.id,
            apiStatus: d.status,
            totals: {
              reportTotal: d.report_total,
              logbookTotal: d.logbook_total,
              performanceTotal: d.student_performance_total,
              totalMarks: d.total_marks,
              finalWeightedMark: Number(d.final_weighted_mark ?? 0),
            },
            formData: {
              reportScores: [
                unscale(d.report_format_score,           2,  4),
                unscale(d.organization_background_score, 3,  4),
                unscale(d.activities_score,              4,  6),
                unscale(d.data_figure_table_score,       3,  8),
                unscale(d.report_content_score,          4, 10),
                unscale(d.recommendation_score,          2,  4),
                unscale(d.conclusion_score,              2,  4),
              ],
              logbookScores: [
                unscale(d.pictures_and_data_score, 1, 5),
                unscale(d.weekly_summary_score,    1, 5),
                unscale(d.daily_detail_score,      1, 5),
                unscale(d.improvement_score,       1, 5),
                unscale(d.initiative_score,        1, 5),
              ],
              performanceScores: [
                unscale(d.understanding_objective_score, 4, 10),
                unscale(d.engagement_score,              3,  6),
                unscale(d.discipline_score,              3,  2),
              ],
            },
          });
        }
      } catch (err) {
        console.warn("Failed to load advisor evaluation from API:", err.message);
      }

      // Fetch overall evaluation status from API
      try {
        const ovRes = await api.get(`/overall-evaluation/${selectedStudent.id}/`);
        if (ovRes.data && !cancelled) {
          setApiOverallEval(ovRes.data);

          // If advisor eval wasn't fetched separately, populate from overall detail
          const detail = ovRes.data.advisor_evaluation_detail;
          if (detail && !advisorEvalApiRecord) {
            const d = detail;
            const unscale = (dbVal, dbMax, frontendMax) =>
              dbMax === 0 ? 0 : Math.round((dbVal ?? 0) / dbMax * frontendMax);
            setAdvisorEvalApiRecord({
              status: ADVISOR_EVAL_STATUS.SUBMITTED,
              submittedAt: d.submitted_at,
              advisorName: d.advisor_name || "",
              apiId: d.id,
              apiStatus: d.status,
              totals: {
                reportTotal: d.report_total,
                logbookTotal: d.logbook_total,
                performanceTotal: d.student_performance_total,
                totalMarks: d.total_marks,
                finalWeightedMark: Number(d.final_weighted_mark ?? 0),
              },
              formData: {
                reportScores: [
                  unscale(d.report_format_score,           2,  4),
                  unscale(d.organization_background_score, 3,  4),
                  unscale(d.activities_score,              4,  6),
                  unscale(d.data_figure_table_score,       3,  8),
                  unscale(d.report_content_score,          4, 10),
                  unscale(d.recommendation_score,          2,  4),
                  unscale(d.conclusion_score,              2,  4),
                ],
                logbookScores: [
                  unscale(d.pictures_and_data_score, 1, 5),
                  unscale(d.weekly_summary_score,    1, 5),
                  unscale(d.daily_detail_score,      1, 5),
                  unscale(d.improvement_score,       1, 5),
                  unscale(d.initiative_score,        1, 5),
                ],
                performanceScores: [
                  unscale(d.understanding_objective_score, 4, 10),
                  unscale(d.engagement_score,              3,  6),
                  unscale(d.discipline_score,              3,  2),
                ],
              },
            });
          }
        }
      } catch {
        // overall may not exist yet — that's fine
      }
      if (!cancelled) setAdvisorEvalLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStudent?.id, advisorEvalNonce]);

  const advisorEvalFormInitial = useMemo(() => {
    if (!selectedStudent) return {};
    const rec = selectedAdvisorEval;
    const advisorLabel =
      session?.fullName || session?.name || session?.username || "";
    return {
      ...(rec?.formData || {}),
      studentName: selectedStudent.studentName || "",
      studentId: selectedStudent.studentId || "",
      idNo: selectedStudent.studentId || "",
      department: selectedStudent.department || "",
      companyName: selectedStudent.companyName || "",
      organization: selectedStudent.companyName || "",
      internshipTitle: selectedStudent.internshipTitle || "",
      supervisorName:
        rec?.formData?.supervisorName ||
        rec?.advisorName ||
        advisorLabel,
    };
  }, [selectedStudent, selectedAdvisorEval, session]);

  const selectedStudentExaminerEvals = useMemo(() => {
    if (!selectedStudent) return { ev1: null, ev2: null };
    const internshipId = selectedStudent?.id || selectedStudent?.__raw?.id;
    const apiList = (internshipId && apiExaminerEvals[internshipId]) || [];

    if (apiList.length > 0) {
      const norm = (s) => String(s || "").trim().toLowerCase();
      const slotNorm1 = norm(selectedStudent.examinerName);
      const slotNorm2 = norm(selectedStudent.examiner2Name);

      // Step 1: exact name match
      let ev1 = slotNorm1
        ? (apiList.find((e) => norm(e.examinerName) === slotNorm1) || null)
        : null;
      let ev2 = slotNorm2
        ? (apiList.find((e) => norm(e.examinerName) === slotNorm2) || null)
        : null;

      // Step 2: if both matched the same record, clear ev2
      if (ev1 && ev2 && ev1 === ev2) ev2 = null;

      // Step 3: index-based fallback for unmatched slots
      const unmatched = apiList.filter((e) => e !== ev1 && e !== ev2);
      if (!ev1 && !ev2) {
        ev1 = apiList[0] || null;
        ev2 = apiList[1] || null;
      } else if (!ev1 && unmatched.length > 0) {
        ev1 = unmatched[0];
      } else if (!ev2 && unmatched.length > 0) {
        ev2 = unmatched[0];
      }

      // Step 4: never assign the same record to both slots
      if (ev1 && ev1 === ev2) ev2 = null;

      return { ev1, ev2 };
    }

    // No API data — fall back to localStorage
    return {
      ev1: getExaminerEvaluationForAdvisorSlot(selectedStudent.studentId, selectedStudent.examinerName),
      ev2: getExaminerEvaluationForAdvisorSlot(selectedStudent.studentId, selectedStudent.examiner2Name),
    };
  }, [selectedStudent, examinerEvalNonce, apiExaminerEvals]);

  const selectedStudentOverall = useMemo(() => {
    if (!selectedStudent) return null;

    const internshipId = String(selectedStudent.id || "");

    // Pull advisor mark directly from overall eval API response
    const advisorDetail = apiOverallEval?.advisor_evaluation_detail;
    const advisorMark = advisorDetail?.final_weighted_mark != null
      ? Number(advisorDetail.final_weighted_mark)
      : (apiOverallEval?.advisor_score != null ? Number(apiOverallEval.advisor_score) : null);

    const hasAdvisor = advisorMark != null && Number.isFinite(advisorMark);

    // Examiner marks from API — use form_data.finalMark (already /25) if available,
    // otherwise fall back to total_score
    const ex1Mark = selectedStudentExaminerEvals.ev1
      ? Number(selectedStudentExaminerEvals.ev1.formData?.finalMark
          ?? selectedStudentExaminerEvals.ev1.totalScore
          ?? NaN)
      : NaN;
    const ex2Mark = selectedStudentExaminerEvals.ev2
      ? Number(selectedStudentExaminerEvals.ev2.formData?.finalMark
          ?? selectedStudentExaminerEvals.ev2.totalScore
          ?? NaN)
      : NaN;

    const hasEx1 = Number.isFinite(ex1Mark);
    const hasEx2 = Number.isFinite(ex2Mark);

    // If overall API has pre-computed scores, use them directly
    if (apiOverallEval?.final_total_score != null) {
      const examinerAvg = Number(apiOverallEval.examiner_average_score ?? 0);
      const companyScore = Number(apiOverallEval.company_score ?? 0);
      const finalTotal = Number(apiOverallEval.final_total_score);

      // Derive monthly/final split from apiFinalEvals and apiMonthlyEvals
      const m1Api = apiMonthlyEvals[internshipId]?.[1];
      const m2Api = apiMonthlyEvals[internshipId]?.[2];
      const m1Perf = m1Api ? Number(m1Api.total_score ?? NaN) : NaN;
      const m2Perf = m2Api ? Number(m2Api.total_score ?? NaN) : NaN;
      const hasM1 = Number.isFinite(m1Perf);
      const hasM2 = Number.isFinite(m2Perf);
      const monthlyAvg20 = hasM1 && hasM2 ? Number(((m1Perf + m2Perf) / 2).toFixed(2)) : null;

      const finalApi = apiFinalEvals[selectedStudent.studentId];
      const finalCompany20 = finalApi
        ? Number(
            finalApi.final_total_score ??
            finalApi.overall_student_performance ??
            finalApi.final_mark ??
            finalApi.company_score ??
            NaN
          )
        : Number(getFinalEvaluation(selectedStudent.studentId)?.finalMark ?? NaN);
      const companyFinal20 = Number.isFinite(finalCompany20) ? finalCompany20 : null;

      return {
        advisorMark: hasAdvisor ? advisorMark : null,
        ex1Mark: hasEx1 ? ex1Mark : null,
        ex2Mark: hasEx2 ? ex2Mark : null,
        examinerAvg: examinerAvg || null,
        academicOverall100: Number((Number(apiOverallEval.advisor_score ?? 0) + examinerAvg).toFixed(2)),
        companyMonthly20: monthlyAvg20,
        companyFinal20,
        companyTotal40: companyScore > 0 ? Number(companyScore.toFixed(2)) : null,
        overallMark100: Number(finalTotal.toFixed(2)),
        complete: hasAdvisor && hasEx1 && hasEx2,
        companyComplete: companyScore > 0,
      };
    }

    // Fallback: compute locally from available API data
    const advisorWeighted = hasAdvisor ? (advisorMark / 35) * 40 : 0;
    const ex1Weighted = hasEx1 ? (ex1Mark / 25) * 30 : 0;
    const ex2Weighted = hasEx2 ? (ex2Mark / 25) * 30 : 0;
    const academicOverall100 = advisorWeighted + ex1Weighted + ex2Weighted;

    const m1Api = apiMonthlyEvals[internshipId]?.[1];
    const m2Api = apiMonthlyEvals[internshipId]?.[2];
    const m1Perf = m1Api ? Number(m1Api.total_score ?? NaN) : NaN;
    const m2Perf = m2Api ? Number(m2Api.total_score ?? NaN) : NaN;
    const hasM1 = Number.isFinite(m1Perf);
    const hasM2 = Number.isFinite(m2Perf);
    const monthlyAvg20 = hasM1 && hasM2 ? (m1Perf + m2Perf) / 2 : NaN;

      const finalApi = apiFinalEvals[selectedStudent.studentId];
      const finalCompany20 = finalApi
        ? Number(
            finalApi.final_total_score ??
            finalApi.overall_student_performance ??
            finalApi.final_mark ??
            finalApi.company_score ??
            NaN
          )
        : Number(getFinalEvaluation(selectedStudent.studentId)?.finalMark ?? NaN);
    const hasFinalCompany = Number.isFinite(finalCompany20);

    const companyMonthly20 = Number.isFinite(monthlyAvg20) ? Number(monthlyAvg20.toFixed(2)) : null;
    const companyFinal20 = hasFinalCompany ? finalCompany20 : null;
    const companyTotal40 =
      companyMonthly20 != null && companyFinal20 != null
        ? Number((companyMonthly20 + companyFinal20).toFixed(2))
        : null;

    const overallMark100 = Number(((academicOverall100 * 0.6) + (companyTotal40 ?? 0)).toFixed(2));

    return {
      advisorMark: hasAdvisor ? advisorMark : null,
      ex1Mark: hasEx1 ? ex1Mark : null,
      ex2Mark: hasEx2 ? ex2Mark : null,
      academicOverall100: Number(academicOverall100.toFixed(2)),
      companyMonthly20,
      companyFinal20,
      companyTotal40,
      overallMark100,
      complete: hasAdvisor && hasEx1 && hasEx2,
      companyComplete: companyTotal40 != null,
    };
  }, [selectedStudent, selectedAdvisorEval, selectedStudentExaminerEvals, apiMonthlyEvals, apiFinalEvals, apiOverallEval, overallNonce]);

  const selectedStudentOverallApprovals = useMemo(() => {
    if (!selectedStudent) return null;

    // Prefer API data from OverallInternshipEvaluation
    if (apiOverallEval) {
      return {
        advisorApproved:
          Boolean(apiOverallEval.advisor_approved) ||
          String(apiOverallEval.status || "").toUpperCase().includes("ADVISOR"),
        examiner1Approved:
          Boolean(apiOverallEval.examiner_completed) ||
          String(apiOverallEval.status || "").toUpperCase().includes("EXAMINER"),
        examiner2Approved:
          Boolean(apiOverallEval.examiner_completed) ||
          String(apiOverallEval.status || "").toUpperCase().includes("EXAMINER"),
        coordinatorApproved:
          Boolean(apiOverallEval.coordinator_approved) ||
          String(apiOverallEval.status || "").toUpperCase().includes("COORDINATOR") ||
          String(apiOverallEval.status || "").toUpperCase().includes("FINAL"),
        advisorApprovedAt: apiOverallEval.advisor_approved_at || null,
        coordinatorApprovedAt: apiOverallEval.coordinator_approved_at || null,
      };
    }

    // Fall back to localStorage
    return getOverallApprovals(selectedStudent.studentId);
  }, [selectedStudent, apiOverallEval, advisorEvalNonce, examinerEvalNonce, internshipDocsNonce]);

  const approvedWeeksCount = useMemo(() => {
    let n = 0;
    for (const app of assignedStudents) {
      const rec = getLogbookForApplication(app);
      n += (rec.weeks || []).filter((w) => w.status === WEEK_STATUS.APPROVED).length;
    }
    return n;
  }, [assignedStudents, logbookNonce]);

  const openStudent = (studentApp, initialDetailTab = "logbook", weekNumber = null) => {
    setSelectedStudent(studentApp);
    // selectedLogbook will be fetched by the useEffect above when selectedStudent changes
    setStudentDetailTab(initialDetailTab);
    setFocusLogbookWeek(weekNumber != null ? Number(weekNumber) : null);
  };

  useEffect(() => {
    if (focusLogbookWeek == null || !selectedStudent) return;
    const el = document.getElementById(`advisor-logbook-week-${focusLogbookWeek}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setFocusLogbookWeek(null);
    }
  }, [focusLogbookWeek, selectedStudent, selectedLogbook]);

  const handleAdvisorDecision = (weekNumber, action) => {
    if (!selectedStudent) return;
    // Update localStorage immediately
    const updated = advisorFinalizeWeek(selectedStudent, weekNumber, action);
    setSelectedLogbook(updated);

    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "Weekly logbook approved" : "Weekly logbook returned",
      message:
        action === "approve"
          ? `Your advisor approved week ${weekNumber} of your internship logbook.`
          : `Your advisor returned week ${weekNumber} for revision. Please update and resubmit.`,
      date: new Date().toISOString(),
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.studentName,
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));

    // ── API sync ──────────────────────────────────────────────────────────
    (async () => {
      try {
        const internshipId = String(selectedStudent?.id || selectedStudent?.internshipId || "");
        const week = selectedLogbook?.weeks?.find((w) => Number(w.weekNumber) === Number(weekNumber));
        const logbookId = week?.apiId || getLogbookApiId(selectedStudent.studentId, internshipId, weekNumber);
        if (logbookId) {
          // Call review directly — backend now accepts SUBMITTED or VERIFIED status
          await internshipService.reviewLogbook(logbookId, action);
        }
      } catch (err) {
        console.warn("Logbook review API sync failed (local state is still saved):", err.message);
      }
      // Refresh logbook from API so UI reflects the new status
      try {
        const internshipId = selectedStudent?.id || selectedStudent?.__raw?.id;
        const params = internshipId ? { internship_id: internshipId } : {};
        const res = await internshipService.getAdvisorLogbooks(params);
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          if (items.length > 0) {
            const grouped = groupApiLogbooksByStudent(items);
            const sid = String(selectedStudent.studentId || "").trim();
            const rec = grouped.get(sid) || grouped.values().next().value;
            if (rec) {
              setSelectedLogbook(rec);
              if (internshipId) {
                setApiLogbooksMap((prev) => ({ ...prev, [String(internshipId)]: rec }));
              }
            }
          }
        }
      } catch {
        // keep the local state if refresh fails
      }
    })();
  };

  const handleAdvisorMonthlyDecision = async ({ action, comment }) => {
    if (!selectedEval) return;

    // Try API first if we have an apiId
    if (selectedEval.eval.apiId) {
      try {
        const res = await evaluationService.reviewMonthlyEvaluation(selectedEval.eval.apiId, action, comment);
        if (res.success) {
          // Refresh API monthly evals
          const refreshRes = await evaluationService.getAdvisorMonthlyEvaluations();
          if (refreshRes.success) {
            const items = Array.isArray(refreshRes.data) ? refreshRes.data : (refreshRes.data?.results || []);
            const map = {};
            items.forEach((item) => {
              if (!map[item.internship]) map[item.internship] = {};
              map[item.internship][item.month_number] = item;
            });
            setApiMonthlyEvals(map);
          }
          setSelectedEval(null);
          return;
        }
      } catch (err) {
        console.warn("API monthly eval decision failed, falling back to local:", err.message);
      }
    }

    // Fallback: localStorage
    advisorDecideEvaluation(selectedEval.eval.studentId, selectedEval.eval.month, action, comment);

    const studentApp = selectedEval.studentApp;
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "Company Monthly Evaluation Approved" : "Company Monthly Evaluation Rejected",
      message: action === "approve"
        ? `Your Month ${selectedEval.eval.month} performance evaluation has been approved by your advisor${comment ? `: "${comment}"` : "."}`
        : `Your Month ${selectedEval.eval.month} performance evaluation was rejected by your advisor${comment ? `: "${comment}"` : ". Please contact your company to revise it."}`,
      date: new Date().toISOString(),
      studentId: selectedEval.eval.studentId,
      studentName: studentApp?.studentName || "",
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));

    refreshMonthlyEvals();
    setSelectedEval(null);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAdvisorFinalDecision = async ({ action, comment }) => {
    if (!selectedFinalEval) return;

    // Try API first if we have an apiId
    const apiId = selectedFinalEval.eval.apiId;
    if (apiId) {
      try {
        const url = action === "approve"
          ? `/evaluations/final-industry/${apiId}/approve/`
          : `/evaluations/final-industry/${apiId}/reject/`;
        const res = await api.patch(url, { comment: comment || "" });
        if (res.data) {
          // Refresh final evals from API
          const refreshRes = await evaluationService.getAdvisorFinalEvaluations();
          if (refreshRes.success) {
            const items = Array.isArray(refreshRes.data) ? refreshRes.data : (refreshRes.data?.results || []);
            const map = {};
            items.forEach((item) => { if (item.student_id) map[item.student_id] = item; });
            setApiFinalEvals(map);
          }
          setSelectedFinalEval(null);
          return;
        }
      } catch (err) {
        console.warn("Final eval API decision failed, falling back to local:", err.message);
      }
    }

    // Fallback: localStorage
    advisorDecideFinalEvaluation(selectedFinalEval.eval.studentId, action, comment);
    const studentApp = selectedFinalEval.studentApp;
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "Company Final Evaluation Approved" : "Company Final Evaluation Rejected",
      message: action === "approve"
        ? `Your final internship evaluation has been approved by your advisor and sent to examiner for final review${comment ? `: "${comment}"` : "."}`
        : `Your final internship evaluation was rejected by your advisor${comment ? `: "${comment}"` : ". Please contact your company to revise it."}`,
      date: new Date().toISOString(),
      studentId: selectedFinalEval.eval.studentId,
      studentName: studentApp?.studentName || "",
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));
    refreshFinalEvals();
    setSelectedFinalEval(null);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAdvisorStudentEvalSubmit = async (formPayload) => {
    if (!selectedStudent) return;

    const internshipId = selectedStudent.id;
    if (!internshipId) {
      alert("Cannot submit: no internship ID found for this student.");
      return;
    }

    // Scale a raw frontend score proportionally into the DB-constrained range.
    // scale(raw, frontendMax, dbMax) → integer in [0, dbMax]
    const scale = (raw, frontendMax, dbMax) =>
      Math.round(Math.min(raw ?? 0, frontendMax) / frontendMax * dbMax);

    const rS = formPayload.reportScores || [];
    const lS = formPayload.logbookScores || [];
    const pS = formPayload.performanceScores || [];

    const body = {
      internship: internshipId,
      // Section 1 — Report (frontend weights: 4,4,6,8,10,4,4 → DB max: 2,3,4,3,4,2,2)
      report_format_score:           scale(rS[0], 4,  2),
      organization_background_score: scale(rS[1], 4,  3),
      activities_score:              scale(rS[2], 6,  4),
      data_figure_table_score:       scale(rS[3], 8,  3),
      report_content_score:          scale(rS[4], 10, 4),
      recommendation_score:          scale(rS[5], 4,  2),
      conclusion_score:              scale(rS[6], 4,  2),
      // Section 2 — Logbook (frontend weights: 5,5,5,5,5 → DB max: 1,1,1,1,1)
      pictures_and_data_score: scale(lS[0], 5, 1),
      weekly_summary_score:    scale(lS[1], 5, 1),
      daily_detail_score:      scale(lS[2], 5, 1),
      improvement_score:       scale(lS[3], 5, 1),
      initiative_score:        scale(lS[4], 5, 1),
      // Section 3 — Performance (frontend weights: 10,6,2 → DB max: 4,3,3)
      understanding_objective_score: scale(pS[0], 10, 4),
      engagement_score:              scale(pS[1], 6,  3),
      discipline_score:              scale(pS[2], 2,  3),
    };

    try {
      const res = await evaluationService.submitAdvisorEvaluationForInternship(internshipId, body);
      if (res.success) {
        // Persist to localStorage only after confirmed API success
        const advisorLabel = session?.fullName || session?.name || session?.username || "Advisor";
        submitAdvisorEvaluation({
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.studentName,
          advisorName: advisorLabel,
          formData: formPayload,
        });
        setAdvisorEvalNonce((n) => n + 1);
      } else {
        const errMsg = res.error?.non_field_errors?.[0] || res.error?.detail || JSON.stringify(res.error);
        alert(`Failed to submit evaluation: ${errMsg}`);
      }
    } catch (err) {
      alert(`Failed to submit evaluation: ${err.message}`);
    }
  };

  const handleAdvisorDocumentQueueDecision = (action) => {
    if (!selectedDocQueue?.doc) return;
    advisorDecideInternshipDocument(selectedDocQueue.doc.id, action, docQueueComment || "");
    setSelectedDocQueue(null);
    setDocQueueComment("");
    setInternshipDocsNonce((n) => n + 1);
  };

  if (!session) {
    return <LoadingState title="Loading advisor dashboard" subtitle="Fetching your assigned students and review queues." />;
  }

  const displayName = session?.fullName || session?.name || session?.username || "Advisor";
  const department = session?.department || "";

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <StaffTopNavigation displayName={displayName} roleLabel="Academic Advisor" notificationCount={pendingWeeksCount + pendingMonthlyEvals.length + pendingFinalEvals.length + pendingAdvisorDocuments.length + pendingOverallQueue.length} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AdvisorSidebar
          currentView={activeTab}
          onNavigate={setActiveTab}
          staffName={displayName}
          pendingDocs={pendingAdvisorDocuments.length}
          pendingMonthly={pendingMonthlyEvals.length}
          pendingFinal={pendingFinalEvals.length}
          pendingLogbook={pendingWeeksCount}
          pendingOverall={pendingOverallQueue.length}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StaffWelcomeHeader
          name={displayName}
          department={department}
          roleLabel="Academic Advisor"
          subtitle="Review weekly internship logbooks after company approval and approve or request revisions from your assigned students."
          statPrimary={assignedStudents.length}
          statSecondary={pendingWeeksCount}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "students" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Assigned internship students</h2>
                  <p className="text-gray-600">Students on active placements where you are the academic advisor.</p>
                </div>

                {assignedStudentsLoading ? (
                  <LoadingState title="Loading assigned students" subtitle="Fetching the students assigned to you as advisor." />
                ) : (
                  <>

                  {assignedStudents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No active internship students are assigned to you yet.</p>
                      <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                        When a coordinator assigns you as advisor on an approved application, students will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {assignedStudents.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => openStudent(app)}
                          className="text-left border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-indigo-50/30 hover:border-indigo-200"
                        >
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{app.studentName}</h3>
                          <div className="flex items-center gap-2 mb-2 text-sm text-indigo-700 font-medium">
                            <Briefcase className="w-4 h-4" />
                            <span>{app.internshipTitle || "Internship"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{app.companyName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <p className="text-xs text-gray-500 font-medium">Click to review placement &amp; evaluations</p>
                            {countPendingAdvisorWeeks(app) > 0 && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                {countPendingAdvisorWeeks(app)} logbook week{countPendingAdvisorWeeks(app) !== 1 ? "s" : ""} pending
                              </span>
                            )}
                            {getAdvisorEvaluation(app.studentId)?.status === ADVISOR_EVAL_STATUS.SUBMITTED && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                                My evaluation submitted
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  </>
                )}
              </div>
            )}

            {activeTab === "queue" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Logbook queue</h2>
                  <p className="text-gray-600">
                    Weeks your company partner approved — open each to review and finalize (approve or return).
                  </p>
                </div>
                {logbookQueueLoading ? (
                  <LoadingState title="Loading logbook queue" subtitle="Fetching advisor logbook weeks from your assigned students." />
                ) : (
                  <>
                {assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : pendingLogbookQueue.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No logbook weeks waiting for your approval.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      When a company approves a student&apos;s weekly log, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingLogbookQueue.map(({ app, week }) => (
                      <button
                        key={`${app.id}-w${week.weekNumber}`}
                        type="button"
                        onClick={() => openStudent(app, "logbook", week.weekNumber)}
                        className="w-full text-left p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex justify-between items-center gap-4"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{app.studentName}</p>
                          <p className="text-sm text-gray-500">{app.companyName}</p>
                          <p className="text-xs font-semibold text-indigo-700 mt-1">
                            Week {week.weekNumber} · {STATUS_LABELS[WEEK_STATUS.PENDING_ADVISOR]}
                          </p>
                        </div>
                        <span className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                          Review &amp; approve
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {activeTab === "monthly" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Monthly Evaluations</h2>
                  <p className="text-gray-600">Company-submitted monthly performance evaluations — pending your approval.</p>
                </div>

                {monthlyEvalsLoading ? (
                  <LoadingState title="Loading monthly evaluations" subtitle="Fetching monthly company evaluations for your students." />
                ) : (
                  <>

                {allMyMonthlyEvals.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No company monthly evaluations submitted yet.</p>
                    <p className="text-sm text-gray-400 mt-2">When the host company submits the company monthly evaluation for one of your students, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allMyMonthlyEvals.map(ev => {
                      const studentApp = assignedStudents.find(a => a.studentId === ev.studentId);
                      const isPending = ev.status === EVAL_STATUS.SUBMITTED;
                      const isApproved = ev.status === EVAL_STATUS.APPROVED;
                      const isRejected = ev.status === EVAL_STATUS.REJECTED;

                      let badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
                      if (isApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEval({ eval: ev, studentApp })}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-indigo-200 hover:bg-indigo-50/40 transition flex justify-between items-center gap-4"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{studentApp?.studentName || ev.studentId}</p>
                            <p className="text-sm text-gray-500">
                              {studentApp?.companyName || ""} · Month {ev.month}
                            </p>
                            {ev.evaluationData?.totalMarks !== undefined && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Score: {ev.evaluationData.totalMarks}/100 · Performance: {ev.evaluationData.monthlyPerformance}/20
                              </p>
                            )}
                            {ev.advisorComment && (
                              <p className="text-xs text-indigo-600 mt-0.5 italic">Your comment: {ev.advisorComment}</p>
                            )}
                          </div>
                          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase border ${badgeClass}`}>
                            {isPending ? "Pending Review" : isApproved ? "Approved" : "Rejected"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                      </>
                    )}
              </div>
            )}

            {activeTab === "final" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Final Evaluations</h2>
                  <p className="text-gray-600">Company-submitted final internship evaluations — pending your approval.</p>
                </div>

                {finalEvalsLoading ? (
                  <LoadingState title="Loading final evaluations" subtitle="Fetching final company evaluations for your students." />
                ) : (
                  <>

                {allMyFinalEvals.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No company final evaluations submitted yet.</p>
                    <p className="text-sm text-gray-400 mt-2">When the host company submits the company final evaluation for one of your students, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allMyFinalEvals.map(ev => {
                      const studentApp = assignedStudents.find(a => a.studentId === ev.studentId);
                      const isApprovedByAdvisor = ev.status === FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR;
                      const isPendingExaminer = ev.status === FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL;
                      const isFinalApproved = ev.status === FINAL_EVAL_STATUS.FINAL_APPROVED;
                      const isRejected = ev.status === FINAL_EVAL_STATUS.REJECTED;

                      let badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
                      if (isApprovedByAdvisor) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isPendingExaminer) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                      if (isFinalApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedFinalEval({ eval: ev, studentApp })}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-indigo-200 hover:bg-indigo-50/40 transition flex justify-between items-center gap-4"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{studentApp?.studentName || ev.studentId}</p>
                            <p className="text-sm text-gray-500">
                              {studentApp?.companyName || ""}
                            </p>
                            {ev.total !== undefined && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Score: {ev.total}/60 · Final Mark: {ev.finalMark}/20
                              </p>
                            )}
                            {ev.advisorComment && (
                              <p className="text-xs text-indigo-600 mt-0.5 italic">Your comment: {ev.advisorComment}</p>
                            )}
                          </div>
                          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase border ${badgeClass}`}>
                            {FINAL_EVAL_STATUS_LABELS[ev.status]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                      </>
                    )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Document queue</h2>
                  <p className="text-gray-600">
                    Internship files uploaded by your students that need your approval (examiner approves separately).
                  </p>
                </div>
                {documentsLoading ? (
                  <LoadingState title="Loading document queue" subtitle="Fetching student document submissions for review." />
                ) : (
                  <>
                {assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : pendingAdvisorDocuments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No documents waiting for your review.</p>
                    <p className="text-sm text-gray-400 mt-2">When a student uploads a file from My Internship, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAdvisorDocuments.map((doc) => {
                      const studentApp = assignedStudents.find(
                        (a) => String(a.studentId) === String(doc.studentId)
                      );
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setDocQueueComment("");
                            setSelectedDocQueue({ doc, studentApp });
                          }}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-amber-200 hover:bg-amber-50/30 transition flex justify-between items-center gap-4"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{doc.title}</p>
                            <p className="text-sm text-gray-500">
                              {studentApp?.studentName || doc.studentName} · {studentApp?.companyName || ""}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Submitted {new Date(doc.submittedAt).toLocaleString()} · Examiner: {doc.examinerStatus}
                            </p>
                          </div>
                          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                            Pending
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {activeTab === "advisor-my-evals" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">My evaluations</h2>
                  <p className="text-gray-600">
                    Your advisor-authored internship evaluations for each assigned student. Open a student from <strong className="text-gray-800">My students</strong> in the sidebar to submit or change (until submitted).
                  </p>
                </div>
                {assignedStudentsLoading ? (
                  <LoadingState title="Loading my evaluations" subtitle="Fetching assigned students and your submitted evaluation status." />
                ) : assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : (
                  <div className="space-y-8">
                    {assignedStudents.map((app) => {
                      const ev = getAdvisorEvaluation(app.studentId);
                      const submitted = ev?.status === ADVISOR_EVAL_STATUS.SUBMITTED;
                      return (
                        <div key={app.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-gray-50/30 space-y-3">
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{app.studentName}</h3>
                              <p className="text-sm text-gray-500">{app.companyName} · {app.internshipTitle || "Internship"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("students");
                                openStudent(app, "advisor-eval");
                              }}
                              className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                            >
                              {submitted ? "View in student" : "Open to submit"}
                            </button>
                          </div>
                          {submitted ? (
                            <AdvisorStudentEvaluationForm
                              readOnly
                              initialData={{
                                ...(ev.formData || {}),
                                studentName: app.studentName || "",
                                idNo: app.studentId || "",
                                department: app.department || "",
                                organization: app.companyName || "",
                                internshipTitle: app.internshipTitle || "",
                                supervisorName:
                                  ev.formData?.supervisorName || ev.advisorName || ev.formData?.advisorName || "",
                              }}
                            />
                          ) : (
                            <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                              You have not submitted your evaluation for this student yet. Use &quot;Open to submit&quot; to complete the form.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "advisor-examiner-evals" && (
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Examiner evaluations</h2>
                  <p className="text-gray-600">
                    Internal examiner 1 and examiner 2 submissions for each student (read only).
                  </p>
                </div>
                {examinerEvalsLoading ? (
                  <LoadingState title="Loading examiner evaluations" subtitle="Fetching examiner submissions for your students." />
                ) : assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : (
                  <div className="space-y-10" key={examinerEvalNonce}>
                    {assignedStudents.map((app) => {
                      const internshipId = app?.id || app?.__raw?.id;
                      const apiList = (internshipId && apiExaminerEvals[internshipId]) || [];
                      // Prefer API data; fall back to localStorage
                      const findEval = (slotName) => {
                        if (apiList.length > 0) {
                          const norm = String(slotName || "").trim().toLowerCase();
                          return apiList.find((e) => String(e.examinerName || "").trim().toLowerCase() === norm)
                            || (apiList.length === 1 && !slotName ? apiList[0] : null);
                        }
                        return getExaminerEvaluationForAdvisorSlot(app.studentId, slotName);
                      };
                      const ev1 = findEval(app.examinerName);
                      const ev2 = findEval(app.examiner2Name);
                      return (
                        <div key={app.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 bg-gray-50/20">
                          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">
                            {app.studentName}
                            <span className="block text-sm font-normal text-gray-500 mt-1">{app.companyName}</span>
                          </h3>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                Examiner 1{app.examinerName ? ` — ${app.examinerName}` : ""}
                              </h4>
                              {!app.examinerName ? (
                                <p className="text-sm text-gray-500">No examiner 1 assigned on this application.</p>
                              ) : !ev1 ? (
                                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                                  Examiner 1 has not submitted an evaluation yet.
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500">
                                    Submitted {new Date(ev1.submittedAt).toLocaleString()}
                                  </p>
                                  <ExaminerUniversityEvaluationForm
                                    readOnly
                                    initialData={{
                                      ...(ev1.formData || {}),
                                      studentName: app.studentName || "",
                                      idNo: app.studentId || "",
                                      department: app.department || "",
                                      organization: app.companyName || "",
                                      examinerName: ev1.examinerName || ev1.formData?.examinerName || "",
                                    }}
                                  />
                                </>
                              )}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                Examiner 2{app.examiner2Name ? ` — ${app.examiner2Name}` : ""}
                              </h4>
                              {!app.examiner2Name ? (
                                <p className="text-sm text-gray-500">No examiner 2 assigned on this application.</p>
                              ) : !ev2 ? (
                                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                                  Examiner 2 has not submitted an evaluation yet.
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500">
                                    Submitted {new Date(ev2.submittedAt).toLocaleString()}
                                  </p>
                                  <ExaminerUniversityEvaluationForm
                                    readOnly
                                    initialData={{
                                      ...(ev2.formData || {}),
                                      studentName: app.studentName || "",
                                      idNo: app.studentId || "",
                                      department: app.department || "",
                                      organization: app.companyName || "",
                                      examinerName: ev2.examinerName || ev2.formData?.examinerName || "",
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "overall-queue" && (
              <div className="app-card p-6 max-w-5xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Overall evaluation queue</h2>
                  <p className="text-gray-600">
                    Students with all component evaluations complete. Approve the overall report as academic advisor.
                  </p>
                </div>
                {overallQueueLoading ? (
                  <LoadingState title="Loading overall queue" subtitle="Fetching the advisor, examiner, and company data needed for overall review." />
                ) : assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : pendingOverallQueue.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No overall evaluations waiting for your approval.</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                      Items appear when advisor, examiner, and company evaluations are submitted and you have not approved yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6" key={overallNonce}>
                    {pendingOverallQueue.map(({ app, overall }) => (
                      <div key={app.id} className="border border-indigo-100 rounded-xl p-4 sm:p-6 bg-indigo-50/20 space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{app.studentName}</h3>
                            <p className="text-sm text-gray-500">{app.companyName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase">Overall mark</p>
                            <p className="text-2xl font-black text-green-700">{overall.overallMark100} / 100</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-[10px] font-black uppercase text-gray-500">Advisor</p>
                            <p className="text-base font-bold text-gray-900 mt-1">
                              {overall.advisorMark != null ? `${overall.advisorMark} / 35` : "—"}
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-[10px] font-black uppercase text-gray-500">Examiner 1</p>
                            <p className="text-base font-bold text-gray-900 mt-1">
                              {overall.ex1Mark != null ? `${overall.ex1Mark} / 25` : "—"}
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-[10px] font-black uppercase text-gray-500">Examiner 2</p>
                            <p className="text-base font-bold text-gray-900 mt-1">
                              {overall.ex2Mark != null ? `${overall.ex2Mark} / 25` : "—"}
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-[10px] font-black uppercase text-gray-500">Company</p>
                            <p className="text-base font-bold text-gray-900 mt-1">
                              {overall.companyTotal40 != null ? `${overall.companyTotal40} / 40` : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              approveOverallAsAdvisor(app.studentId);
                              setOverallNonce((n) => n + 1);
                            }}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                          >
                            Approve overall evaluation
                          </button>
                          <button
                            type="button"
                            onClick={() => openStudent(app, "overall-eval")}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 border-indigo-200 text-indigo-800 text-sm font-bold hover:bg-indigo-50"
                          >
                            Open student record
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="app-card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned students</span>
                  <span className="text-lg font-bold text-gray-900">{assignedStudents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending logbook weeks</span>
                  <span className="text-lg font-bold text-yellow-600">{pendingWeeksCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending company monthly evals</span>
                  <span className="text-lg font-bold text-yellow-600">{pendingMonthlyEvals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending documents</span>
                  <span className="text-lg font-bold text-amber-600">{pendingAdvisorDocuments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved weeks (all time)</span>
                  <span className="text-lg font-bold text-green-600">{approvedWeeksCount}</span>
                </div>
              </div>
            </div>

            <div className="app-card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Workflow
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  Company approves the student week first; then it appears for your approval.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  Use <strong className="text-gray-800">My students</strong> in the sidebar to open a student and approve or reject each week.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  Company monthly evaluations submitted by the host appear under <strong className="text-gray-800">Monthly evaluations</strong> in the sidebar for your review.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  Use <strong className="text-gray-800">My evaluations</strong> and <strong className="text-gray-800">Examiner evaluations</strong> in the sidebar to review submissions across all students.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  Student uploads appear under <strong className="text-gray-800">Document queue</strong> until you approve or reject them.
                </li>
              </ul>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {selectedStudent && selectedLogbook && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="app-modal-panel mx-auto my-8 max-w-5xl p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    {selectedStudent.companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    {selectedStudent.internshipTitle || "Internship"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedStudent(null); setSelectedLogbook(null); }}
                className="self-start px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>

            {/* Inner tabs */}
            <div className="app-tab-shell mb-6">
              <button
                type="button"
                onClick={() => setStudentDetailTab("logbook")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "logbook" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <BookOpen className="w-4 h-4" /> Weekly Logbook
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("monthly")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "monthly" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <ClipboardList className="w-4 h-4" /> Company Monthly Evaluation
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("advisor-eval")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "advisor-eval" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <ClipboardList className="w-4 h-4" /> My evaluation
                {selectedAdvisorEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED && (
                  <span className="ml-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" title="Submitted" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("final")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "final" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <ClipboardList className="w-4 h-4" /> Company Final Evaluation
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("examiner-eval")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "examiner-eval" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <ClipboardList className="w-4 h-4" /> Examiner evaluation
                {(selectedStudentExaminerEvals.ev1 || selectedStudentExaminerEvals.ev2) && (
                  <span className="ml-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" title="At least one submitted" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("overall-eval")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${studentDetailTab === "overall-eval" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <ClipboardList className="w-4 h-4" /> Overall evaluation
                {selectedStudentOverall?.complete && (
                  <span className="ml-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" title="Complete" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("documents")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-bold transition-all sm:px-3 ${studentDetailTab === "documents" ? "app-tab-active" : "app-tab-inactive"}`}
              >
                <FileText className="w-4 h-4 shrink-0" /> Documents
              </button>
            </div>

            {/* ── Weekly Logbook tab ── */}
            {studentDetailTab === "logbook" && (
              <div className="space-y-4">
                {logbookLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 mr-3" />
                    <p className="text-sm text-slate-500">Loading logbook…</p>
                  </div>
                ) : !selectedLogbook || selectedLogbook.weeks.filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">This student has not submitted any logbook weeks yet.</p>
                  </div>
                ) : (
                  selectedLogbook.weeks
                    .filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED)
                    .map((week) => {
                      // Advisor can act on SUBMITTED or VERIFIED logbooks
                      const isPending = week.status === WEEK_STATUS.PENDING_ADVISOR ||
                        week.apiStatus === "SUBMITTED" ||
                        week.apiStatus === "VERIFIED";
                      const isApproved = week.status === WEEK_STATUS.APPROVED || week.apiStatus === "REVIEWED";
                      const isRejected = week.status === WEEK_STATUS.REJECTED_ADVISOR;

                      let badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
                      if (isApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";
                      if (week.status === WEEK_STATUS.PENDING_COMPANY) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";

                      return (
                        <div
                          key={week.weekNumber}
                          id={`advisor-logbook-week-${week.weekNumber}`}
                          className={`border rounded-xl p-4 sm:p-6 space-y-4 bg-gray-50/30 ${
                            isPending ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-200"
                          }`}
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <p className="font-black text-gray-900">Week {week.weekNumber}</p>
                            <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${badgeClass}`}>
                              {STATUS_LABELS[week.status]}
                            </span>
                          </div>

                          <InternshipLogbookForm
                            key={`${selectedStudent.studentId}-w${week.weekNumber}`}
                            role="viewer"
                            readOnly
                            title={`Week ${week.weekNumber} — read only`}
                            initialData={{
                              studentName: selectedLogbook.meta?.studentName || selectedStudent.studentName || "",
                              companyName: selectedLogbook.meta?.companyName || selectedStudent.companyName || "",
                              supervisorName: selectedLogbook.meta?.supervisorName || "",
                              safetyBrief: selectedLogbook.meta?.safetyBrief || "",
                              weeks: [week],
                            }}
                          />

                          {isPending && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => handleAdvisorDecision(week.weekNumber, "approve")}
                                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve week
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdvisorDecision(week.weekNumber, "reject")}
                                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
                              >
                                Reject week
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <div className="flex items-center gap-2 pt-1 text-green-700 text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" /> Approved by you
                            </div>
                          )}

                          {isRejected && (
                            <div className="pt-1 text-red-600 text-sm font-semibold">
                              Rejected — awaiting student revision
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* ── Company Monthly Evaluation tab ── */}
            {studentDetailTab === "monthly" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {monthlyEvalsLoading ? (
                  <div className="sm:col-span-2">
                    <LoadingState title="Loading monthly evaluation" subtitle="Fetching the company monthly records for this student." />
                  </div>
                ) : (
                  <>
                {[1, 2].map(month => {
                  const internshipId = selectedStudent?.id || selectedStudent?.__raw?.id;
                  const apiRec = internshipId && apiMonthlyEvals[internshipId]?.[month];
                  // Prefer API data; fall back to localStorage
                  const rec = apiRec
                    ? {
                        status: apiRec.status === "ADVISOR_APPROVED" ? EVAL_STATUS.APPROVED
                               : apiRec.status === "REJECTED" ? EVAL_STATUS.REJECTED
                               : EVAL_STATUS.SUBMITTED,
                        advisorComment: apiRec.advisor_comment || "",
                        evaluationData: {
                          ...(apiRec.form_data || {}),
                          totalMarks: (apiRec.form_data?.totalMarks ?? apiRec.total_score),
                          monthlyPerformance: (apiRec.form_data?.monthlyPerformance ?? (apiRec.total_score ? ((apiRec.total_score/100)*20) : null)),
                        },
                        apiId: apiRec.id,
                      }
                    : getEvaluation(selectedStudent.studentId, month);
                  const status = rec?.status || EVAL_STATUS.NOT_STARTED;
                  const badgeMap = {
                    [EVAL_STATUS.NOT_STARTED]: "bg-gray-100 text-gray-600 border-gray-200",
                    [EVAL_STATUS.SUBMITTED]:   "bg-indigo-100 text-indigo-700 border-indigo-200",
                    [EVAL_STATUS.APPROVED]:    "bg-green-100 text-green-700 border-green-200",
                    [EVAL_STATUS.REJECTED]:    "bg-red-100 text-red-700 border-red-200",
                  };
                  return (
                    <div key={month} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/30">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">Month {month} Evaluation</h4>
                        <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${badgeMap[status] || badgeMap[EVAL_STATUS.NOT_STARTED]}`}>
                          {EVAL_STATUS_LABELS[status]}
                        </span>
                      </div>

                      {status === EVAL_STATUS.NOT_STARTED ? (
                        <p className="text-sm text-gray-400">Not submitted yet by the company.</p>
                      ) : (
                        <>
                          {rec?.evaluationData?.totalMarks !== undefined && (
                            <div className="flex gap-4 text-sm">
                              <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3 text-center">
                                <p className="text-xs text-gray-400 font-medium mb-1">Total Score</p>
                                <p className="text-xl font-black text-gray-900">
                                  {rec.evaluationData.totalMarks}
                                  <span className="text-xs font-normal text-gray-400">/100</span>
                                </p>
                              </div>
                              <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3 text-center">
                                <p className="text-xs text-gray-400 font-medium mb-1">Performance</p>
                                <p className="text-xl font-black text-green-700">
                                  {rec.evaluationData.monthlyPerformance}
                                  <span className="text-xs font-normal text-gray-400">/20</span>
                                </p>
                              </div>
                            </div>
                          )}
                          <InternshipMonthlyEvaluation
                            key={`adv-${selectedStudent.studentId}-m${month}`}
                            initialData={rec?.evaluationData || {}}
                            readOnly
                            existingAdvisorComment={rec?.advisorComment || ""}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
                  </>
                )}
              </div>
            )}

            {studentDetailTab === "advisor-eval" && (
              <div className="space-y-4">
                {advisorEvalLoading ? (
                  <LoadingState title="Loading my evaluation" subtitle="Fetching your advisor evaluation and overall status for this student." />
                ) : (
                  <>
                <div className="flex flex-wrap justify-between gap-2 items-center">
                  <p className="text-sm text-gray-600">
                    Complete your own academic assessment of this student&apos;s internship. The student can read it after you submit.
                  </p>
                  {selectedAdvisorEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED && (
                    <span className="text-xs font-black uppercase px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                      Submitted {new Date(selectedAdvisorEval.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <AdvisorStudentEvaluationForm
                  key={`adv-student-eval-${selectedStudent.studentId}-${selectedAdvisorEval?.submittedAt || "new"}`}
                  initialData={advisorEvalFormInitial}
                  readOnly={selectedAdvisorEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED}
                  onSubmit={
                    selectedAdvisorEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED
                      ? undefined
                      : handleAdvisorStudentEvalSubmit
                  }
                />
                  </>
                )}
              </div>
            )}

            {/* ── Company Final Evaluation tab ── */}
            {studentDetailTab === "final" && (
              <div className="space-y-6">
                {finalEvalsLoading ? (
                  <LoadingState title="Loading final evaluation" subtitle="Fetching the company final evaluation for this student." />
                ) : (
                  <>
                {(() => {
                  const apiRec = apiFinalEvals[selectedStudent.studentId];
                  const finalEval = apiRec
                    ? {
                        status: apiRec.status === "ADVISOR_APPROVED"
                          ? FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR
                          : apiRec.status === "REJECTED"
                          ? FINAL_EVAL_STATUS.REJECTED
                          : FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL,
                        total: apiRec.total_mark,
                        finalMark: Number(apiRec.overall_student_performance ?? 0),
                        formData: apiRec.form_data || {},
                        advisorComment: apiRec.advisor_comment || "",
                        examinerComment: "",
                        apiId: apiRec.id,
                      }
                    : getFinalEvaluation(selectedStudent.studentId);

                  if (!finalEval) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No company final evaluation submitted yet by the company.</p>
                      </div>
                    );
                  }

                  const badgeMap = {
                    [FINAL_EVAL_STATUS.NOT_STARTED]: "bg-gray-100 text-gray-600 border-gray-200",
                    [FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL]: "bg-indigo-100 text-indigo-700 border-indigo-200",
                    [FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR]: "bg-green-100 text-green-700 border-green-200",
                    [FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL]: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    [FINAL_EVAL_STATUS.FINAL_APPROVED]: "bg-green-100 text-green-700 border-green-200",
                    [FINAL_EVAL_STATUS.REJECTED]: "bg-red-100 text-red-700 border-red-200",
                  };

                  return (
                    <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/30">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">Final Internship Evaluation</h4>
                        <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${badgeMap[finalEval.status] || badgeMap[FINAL_EVAL_STATUS.NOT_STARTED]}`}>
                          {FINAL_EVAL_STATUS_LABELS[finalEval.status]}
                        </span>
                      </div>

                      {finalEval.total !== undefined && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-600 mb-1">Total Score</p>
                              <p className="text-2xl font-bold text-indigo-700">{finalEval.total} / 60</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-600 mb-1">Final Mark</p>
                              <p className="text-2xl font-bold text-green-700">{finalEval.finalMark} / 20</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <InternshipEvaluationForm
                        key={`adv-final-${selectedStudent.studentId}`}
                        initialData={finalEval.formData || {}}
                        readOnly
                        advisorComment={finalEval.advisorComment || ""}
                        examinerComment={finalEval.examinerComment || ""}
                      />
                    </div>
                  );
                })()}
                  </>
                )}
              </div>
            )}

            {studentDetailTab === "examiner-eval" && (
              <div className="space-y-4">
                {examinerEvalsLoading ? (
                  <LoadingState title="Loading examiner evaluations" subtitle="Fetching examiner submissions for this student." />
                ) : (
                  <>
                <p className="text-sm text-gray-600">
                  Internal examiner forms for this student (read only). The same view is available under{" "}
                  <strong className="text-gray-800">Examiner evaluations</strong> on the main dashboard.
                </p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Examiner 1 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                      Examiner 1
                      {(selectedStudent.examinerName || selectedStudentExaminerEvals.ev1?.examinerName)
                        ? ` — ${selectedStudent.examinerName || selectedStudentExaminerEvals.ev1?.examinerName}`
                        : ""}
                    </h4>
                    {!selectedStudentExaminerEvals.ev1 ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                        Examiner 1 has not submitted an evaluation yet.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">
                          Submitted{" "}
                          {new Date(selectedStudentExaminerEvals.ev1.submittedAt).toLocaleString()}
                        </p>
                        <ExaminerUniversityEvaluationForm
                          readOnly
                          initialData={{
                            ...(selectedStudentExaminerEvals.ev1.formData || {}),
                            studentName: selectedStudent.studentName || "",
                            idNo: selectedStudent.studentId || "",
                            department: selectedStudent.department || "",
                            organization: selectedStudent.companyName || "",
                            examinerName:
                              selectedStudentExaminerEvals.ev1.examinerName ||
                              selectedStudentExaminerEvals.ev1.formData?.examinerName ||
                              "",
                          }}
                        />
                      </>
                    )}
                  </div>
                  {/* Examiner 2 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                      Examiner 2
                      {(selectedStudent.examiner2Name || selectedStudentExaminerEvals.ev2?.examinerName)
                        ? ` — ${selectedStudent.examiner2Name || selectedStudentExaminerEvals.ev2?.examinerName}`
                        : ""}
                    </h4>
                    {!selectedStudentExaminerEvals.ev2 ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                        Examiner 2 has not submitted an evaluation yet.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">
                          Submitted{" "}
                          {new Date(selectedStudentExaminerEvals.ev2.submittedAt).toLocaleString()}
                        </p>
                        <ExaminerUniversityEvaluationForm
                          readOnly
                          initialData={{
                            ...(selectedStudentExaminerEvals.ev2.formData || {}),
                            studentName: selectedStudent.studentName || "",
                            idNo: selectedStudent.studentId || "",
                            department: selectedStudent.department || "",
                            organization: selectedStudent.companyName || "",
                            examinerName:
                              selectedStudentExaminerEvals.ev2.examinerName ||
                              selectedStudentExaminerEvals.ev2.formData?.examinerName ||
                              "",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {studentDetailTab === "overall-eval" && (
              <div className="space-y-6">
                {advisorEvalLoading ? (
                  <LoadingState title="Loading overall evaluation" subtitle="Fetching the advisor and overall evaluation data for this student." />
                ) : (
                  <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Overall evaluation</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Auto-calculated from your advisor evaluation and both internal examiner evaluations.
                    </p>
                  </div>
                  {selectedStudentOverall && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase">Overall mark</p>
                      <p className="text-2xl font-black text-green-700">
                        {selectedStudentOverall.overallMark100} / 100
                      </p>
                      {!selectedStudentOverall.complete && (
                        <p className="text-xs text-amber-700 font-semibold mt-1">
                          Waiting for all evaluations to be submitted.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Advisor</p>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {selectedStudentOverall?.advisorMark != null
                        ? `${selectedStudentOverall.advisorMark} / 35`
                        : "Not submitted"}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Examiner 1</p>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {selectedStudentOverall?.ex1Mark != null
                        ? `${selectedStudentOverall.ex1Mark} / 25`
                        : "Not submitted"}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Examiner 2</p>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {selectedStudentOverall?.ex2Mark != null
                        ? `${selectedStudentOverall.ex2Mark} / 25`
                        : "Not submitted"}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Company (Monthly+Final)</p>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {selectedStudentOverall?.companyTotal40 != null
                        ? `${selectedStudentOverall.companyTotal40} / 40`
                        : "Not ready"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Monthly avg: {selectedStudentOverall?.companyMonthly20 ?? "—"} / 20 · Final: {selectedStudentOverall?.companyFinal20 ?? "—"} / 20
                    </p>
                  </div>
                </div>

                {selectedStudentOverallApprovals && (
                  <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                    <h5 className="font-bold text-gray-900">Approval status</h5>
                    <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                      <span className={`px-3 py-1 rounded-full border ${selectedStudentOverallApprovals.advisorApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        Advisor: {selectedStudentOverallApprovals.advisorApproved ? "Approved" : "Pending"}
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${selectedStudentOverallApprovals.examiner1Approved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        Examiner 1: {selectedStudentOverallApprovals.examiner1Approved ? "Approved" : "Pending"}
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${selectedStudentOverallApprovals.examiner2Approved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        Examiner 2: {selectedStudentOverallApprovals.examiner2Approved ? "Approved" : "Pending"}
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${selectedStudentOverallApprovals.coordinatorApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        Coordinator: {selectedStudentOverallApprovals.coordinatorApproved ? "Approved" : "Pending"}
                      </span>
                    </div>

                    {!selectedStudentOverallApprovals.advisorApproved && (
                      <button
                        type="button"
                        disabled={!selectedStudentOverall?.complete}
                        onClick={async () => {
                          // Approve the advisor's own evaluation via API
                          const advisorEvalId = selectedAdvisorEval?.apiId;
                          if (advisorEvalId) {
                            try {
                              const res = await evaluationService.approveAdvisorEvaluation(advisorEvalId);
                              if (res.success) {
                                // Refresh overall from API
                                try {
                                  const ov = await api.get(`/overall-evaluation/${selectedStudent.id}/`);
                                  if (ov.data) setApiOverallEval(ov.data);
                                } catch { /* ignore */ }
                                setAdvisorEvalNonce((n) => n + 1);
                              } else {
                                alert(`Approval failed: ${res.error?.detail || JSON.stringify(res.error)}`);
                              }
                            } catch (err) {
                              alert(`Approval failed: ${err.message}`);
                            }
                          } else {
                            // Fallback: local only
                            approveOverallAsAdvisor(selectedStudent.studentId);
                          }
                        }}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Approve overall evaluation
                      </button>
                    )}
                    {!selectedStudentOverall?.complete && (
                      <p className="text-xs text-gray-500">
                        Advisor approval requires: advisor evaluation submitted + examiner 1 + examiner 2 evaluations submitted + final report submitted.
                      </p>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {studentDetailTab === "documents" && (
              documentsLoading ? (
                <LoadingState title="Loading documents" subtitle="Fetching document submissions for this student." />
              ) : (
                <AdvisorStudentDocumentsPanel
                  studentId={selectedStudent.studentId}
                  internshipId={selectedStudent.id}
                  advisorIdentity={advisorIdentity}
                />
              )
            )}
          </div>
        </div>
      )}
      {selectedEval && (
        <div className="fixed inset-0 bg-black/60 z-[190] p-4 overflow-y-auto">
          <div className="app-modal-panel mx-auto my-8 max-w-4xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEval.studentApp?.studentName || selectedEval.eval.studentId} — Month {selectedEval.eval.month} Evaluation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedEval.studentApp?.companyName || ""} · Submitted {new Date(selectedEval.eval.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                className="self-start px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <InternshipMonthlyEvaluation
              key={selectedEval.eval.id}
              initialData={selectedEval.eval.evaluationData || {}}
              readOnly
              advisorView={selectedEval.eval.status === EVAL_STATUS.SUBMITTED}
              existingAdvisorComment={selectedEval.eval.advisorComment || ""}
              onAdvisorAction={
                selectedEval.eval.status === EVAL_STATUS.SUBMITTED
                  ? handleAdvisorMonthlyDecision
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {selectedFinalEval && (
        <div className="fixed inset-0 bg-black/60 z-[190] p-4 overflow-y-auto">
          <div className="app-modal-panel mx-auto my-8 max-w-4xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedFinalEval.studentApp?.studentName || selectedFinalEval.eval.studentId} — Final Internship Evaluation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFinalEval.studentApp?.companyName || ""} · Submitted {new Date(selectedFinalEval.eval.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFinalEval(null)}
                className="self-start px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <InternshipEvaluationForm
              key={selectedFinalEval.eval.id}
              initialData={selectedFinalEval.eval.formData || {}}
              readOnly
              advisorView={selectedFinalEval.eval.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL}
              advisorComment={selectedFinalEval.eval.advisorComment || ""}
              examinerComment={selectedFinalEval.eval.examinerComment || ""}
              onAdvisorAction={
                selectedFinalEval.eval.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL
                  ? handleAdvisorFinalDecision
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {selectedDocQueue?.doc && (
        <div className="fixed inset-0 bg-black/60 z-[190] p-4 overflow-y-auto">
          <div className="app-modal-panel mx-auto my-8 max-w-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDocQueue.studentApp?.studentName || selectedDocQueue.doc.studentName} — Document review
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDocQueue.doc.title} · Submitted {new Date(selectedDocQueue.doc.submittedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Examiner status: {selectedDocQueue.doc.examinerStatus} (separate approval)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocQueue(null);
                  setDocQueueComment("");
                }}
                className="self-start px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>

            {selectedDocQueue.doc.description && (
              <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {selectedDocQueue.doc.description}
              </p>
            )}

            <div className="mb-6">
              <a
                href={selectedDocQueue.doc.fileData}
                download={selectedDocQueue.doc.fileName}
                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
              >
                <FileText className="w-4 h-4" /> Download {selectedDocQueue.doc.fileName}
              </a>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase">Optional comment for the student</label>
              <textarea
                value={docQueueComment}
                onChange={(e) => setDocQueueComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm"
                placeholder="Feedback (optional)"
              />
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAdvisorDocumentQueueDecision("approve")}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" /> Approve document
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvisorDocumentQueueDecision("reject")}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
                >
                  Reject document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorDashboard;
