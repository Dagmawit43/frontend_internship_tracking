import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import { useAuth } from "../contexts/AuthContext";
import InternshipLogbookForm from "./InternshipLogbookForm";
import InternshipMonthlyEvaluation from "./InternshipMonthlyEvaluation";
import InternshipEvaluationForm from "./InternshipEvaluationForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  ensureWeeklyLogbookForInternship,
  updateWeekForInternship,
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
  getDocumentsByStudentId,
  getDocumentsForAdvisorStudents,
  advisorDecideInternshipDocument,
  ROLE_DOC_STATUS,
} from "../utils/internshipDocuments";

const normStr = (s) => String(s || "").trim().toLowerCase();

const AdvisorStudentDocumentsPanel = ({ studentId, advisorIdentity }) => {
  const [docs, setDocs] = useState([]);
  const [commentByDoc, setCommentByDoc] = useState({});

  const reload = () => {
    const list = getDocumentsByStudentId(studentId).filter(
      (d) => normStr(d.advisorName) === normStr(advisorIdentity)
    );
    setDocs(list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  };

  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, [studentId, advisorIdentity]);

  const decide = (docId, action) => {
    advisorDecideInternshipDocument(docId, action, commentByDoc[docId] || "");
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
                className="text-sm font-bold text-blue-600 hover:underline shrink-0"
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
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="AASTU Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Internship Tracking System</h1>
              <p className="text-xs text-gray-500">AASTU</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4 sm:mr-2 inline sm:hidden" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {displayName || roleLabel}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-1 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{displayName || roleLabel}</p>
                      <p className="text-xs text-gray-500">{roleLabel} Account</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const StaffWelcomeHeader = ({ name, department, roleLabel, subtitle, statPrimary, statSecondary }) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
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
        {subtitle && <p className="text-sm text-blue-100 mt-3 max-w-xl">{subtitle}</p>}
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
  const [session, setSession] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [studentDetailTab, setStudentDetailTab] = useState("logbook");

  // Monthly evaluations state
  const [monthlyEvals, setMonthlyEvals] = useState([]);
  const [selectedEval, setSelectedEval] = useState(null); // { eval, studentApp }
  
  // Final evaluations state
  const [finalEvals, setFinalEvals] = useState([]);
  const [selectedFinalEval, setSelectedFinalEval] = useState(null); // { eval, studentApp }
  const [selectedDocQueue, setSelectedDocQueue] = useState(null); // { doc, studentApp }
  const [internshipDocsNonce, setInternshipDocsNonce] = useState(0);
  const [docQueueComment, setDocQueueComment] = useState("");

  const refreshMonthlyEvals = () => setMonthlyEvals(getAllEvaluations());
  const refreshFinalEvals = () => setFinalEvals(getAllFinalEvaluations());

  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("user"));
    if (!activeSession || activeSession.role !== "Advisor") {
      navigate("/login");
      return;
    }
    setSession(activeSession);
  }, [navigate]);

  const advisorIdentity = useMemo(() => {
    const name = session?.fullName || session?.name || session?.username || "";
    return String(name || "").trim().toLowerCase();
  }, [session]);

  useEffect(() => {
    if (!advisorIdentity) return;
    const loadAssigned = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const active = allApps.filter((app) => {
        const isActiveIntern = app.finalInternshipStatus === "ACTIVE_INTERN";
        const assignedAdvisor = String(app.advisorName || "").trim().toLowerCase();
        return isActiveIntern && assignedAdvisor === advisorIdentity;
      });
      setAssignedStudents(active);
    };
    loadAssigned();
    window.addEventListener("storage", loadAssigned);
    return () => window.removeEventListener("storage", loadAssigned);
  }, [advisorIdentity]);

  // Load monthly evals whenever assigned students change or storage updates
  useEffect(() => {
    refreshMonthlyEvals();
    refreshFinalEvals();
    window.addEventListener("storage", refreshMonthlyEvals);
    window.addEventListener("storage", refreshFinalEvals);
    return () => {
      window.removeEventListener("storage", refreshMonthlyEvals);
      window.removeEventListener("storage", refreshFinalEvals);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const bump = () => setInternshipDocsNonce((n) => n + 1);
    window.addEventListener("storage", bump);
    return () => window.removeEventListener("storage", bump);
  }, []);

  const pendingWeeksCount = useMemo(() => {
    let n = 0;
    for (const app of assignedStudents) {
      const rec = ensureWeeklyLogbookForInternship({
        studentId: app.studentId,
        internshipId: app.internshipId || app.id,
        companyId: app.companyId || app.companyName || "",
        advisorId: app.advisorName || "",
      });
      n += (rec.weeks || []).filter((w) => w.status === WEEK_STATUS.PENDING_ADVISOR).length;
    }
    return n;
  }, [assignedStudents]);

  // Monthly evals submitted to this advisor (matched by advisorName or studentId fallback)
  const pendingMonthlyEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    return monthlyEvals.filter(e => {
      const byAdvisor = String(e.advisorName || "").trim().toLowerCase() === advisorIdentity;
      const byStudent = studentIds.has(e.studentId);
      return (byAdvisor || byStudent) && e.status === EVAL_STATUS.SUBMITTED;
    });
  }, [monthlyEvals, assignedStudents, advisorIdentity]);

  // All evals for this advisor's students (any status) — for the full list view
  const allMyMonthlyEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    return monthlyEvals.filter(e => {
      const byAdvisor = String(e.advisorName || "").trim().toLowerCase() === advisorIdentity;
      const byStudent = studentIds.has(e.studentId);
      return byAdvisor || byStudent;
    });
  }, [monthlyEvals, assignedStudents, advisorIdentity]);

  // Final evaluations pending advisor approval
  const pendingFinalEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    return finalEvals.filter(e => {
      const byStudent = studentIds.has(e.studentId);
      return byStudent && e.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL;
    });
  }, [finalEvals, assignedStudents]);

  // All final evaluations for this advisor's students
  const allMyFinalEvals = useMemo(() => {
    const studentIds = new Set(assignedStudents.map(a => a.studentId));
    return finalEvals.filter(e => studentIds.has(e.studentId));
  }, [finalEvals, assignedStudents]);

  const pendingAdvisorDocuments = useMemo(() => {
    const ids = assignedStudents.map((a) => a.studentId);
    return getDocumentsForAdvisorStudents(advisorIdentity, ids).filter(
      (d) => d.advisorStatus === ROLE_DOC_STATUS.PENDING
    );
  }, [advisorIdentity, assignedStudents, internshipDocsNonce]);

  const approvedWeeksCount = useMemo(() => {
    let n = 0;
    for (const app of assignedStudents) {
      const rec = ensureWeeklyLogbookForInternship({
        studentId: app.studentId,
        internshipId: app.internshipId || app.id,
        companyId: app.companyId || app.companyName || "",
        advisorId: app.advisorName || "",
      });
      n += (rec.weeks || []).filter((w) => w.status === WEEK_STATUS.APPROVED).length;
    }
    return n;
  }, [assignedStudents]);

  const openStudent = (studentApp) => {
    const record = ensureWeeklyLogbookForInternship({
      studentId: studentApp.studentId,
      internshipId: studentApp.internshipId || studentApp.id,
      companyId: studentApp.companyId || studentApp.companyName || "",
      advisorId: studentApp.advisorName || session?.username || "",
    });
    setSelectedStudent(studentApp);
    setSelectedLogbook(record);
    setStudentDetailTab("logbook");
  };

  const handleAdvisorDecision = (weekNumber, action) => {
    if (!selectedStudent) return;
    const updated = updateWeekForInternship(
      {
        studentId: selectedStudent.studentId,
        internshipId: selectedStudent.internshipId || selectedStudent.id,
        companyId: selectedStudent.companyId || selectedStudent.companyName || "",
        advisorId: selectedStudent.advisorName || session?.username || "",
      },
      weekNumber,
      (week) => {
        if (week.status !== WEEK_STATUS.PENDING_ADVISOR) return week;
        if (action === "approve") {
          return {
            ...week,
            advisorStatus: "APPROVED",
            status: WEEK_STATUS.APPROVED,
          };
        }
        return {
          ...week,
          advisorStatus: "REJECTED",
          status: WEEK_STATUS.REJECTED_ADVISOR,
        };
      }
    );
    setSelectedLogbook(updated);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAdvisorMonthlyDecision = ({ action, comment }) => {
    if (!selectedEval) return;
    advisorDecideEvaluation(selectedEval.eval.studentId, selectedEval.eval.month, action, comment);

    // Notify the student
    const studentApp = selectedEval.studentApp;
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "Monthly Evaluation Approved" : "Monthly Evaluation Rejected",
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

  const handleAdvisorFinalDecision = ({ action, comment }) => {
    if (!selectedFinalEval) return;
    advisorDecideFinalEvaluation(selectedFinalEval.eval.studentId, action, comment);

    // Notify the student
    const studentApp = selectedFinalEval.studentApp;
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "Final Evaluation Approved" : "Final Evaluation Rejected",
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

  const handleAdvisorDocumentQueueDecision = (action) => {
    if (!selectedDocQueue?.doc) return;
    advisorDecideInternshipDocument(selectedDocQueue.doc.id, action, docQueueComment || "");
    setSelectedDocQueue(null);
    setDocQueueComment("");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = session?.fullName || session?.name || session?.username || "Advisor";
  const department = session?.department || "";

  return (
    <div className="min-h-screen bg-gray-100">
      <StaffTopNavigation displayName={displayName} roleLabel="Academic Advisor" notificationCount={pendingWeeksCount + pendingMonthlyEvals.length + pendingFinalEvals.length + pendingAdvisorDocuments.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffWelcomeHeader
          name={displayName}
          department={department}
          roleLabel="Academic Advisor"
          subtitle="Review weekly internship logbooks after company approval and approve or request revisions from your assigned students."
          statPrimary={assignedStudents.length}
          statSecondary={pendingWeeksCount}
        />

        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-5xl overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "students" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            My Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "queue" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Logbook queue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "monthly" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Monthly Evaluations
            {pendingMonthlyEvals.length > 0 && (
              <span className="ml-1 bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {pendingMonthlyEvals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("final")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "final" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Final Evaluations
            {pendingFinalEvals.length > 0 && (
              <span className="ml-1 bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {pendingFinalEvals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "documents" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            Document queue
            {pendingAdvisorDocuments.length > 0 && (
              <span className="ml-1 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {pendingAdvisorDocuments.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "students" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Assigned internship students</h2>
                  <p className="text-gray-600">Students on active placements where you are the academic advisor.</p>
                </div>

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
                        className="text-left border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-blue-50/30 hover:border-blue-200"
                      >
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{app.studentName}</h3>
                        <div className="flex items-center gap-2 mb-2 text-sm text-blue-700 font-medium">
                          <Briefcase className="w-4 h-4" />
                          <span>{app.internshipTitle || "Internship"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>{app.companyName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">Click to review weekly logbooks</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "queue" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Pending advisor approvals</h2>
                  <p className="text-gray-600">Weeks awaiting your decision (same as opening a student below).</p>
                </div>
                {assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students assigned.</div>
                ) : (
                  <div className="space-y-3">
                    {assignedStudents.map((app) => {
                      const rec = ensureWeeklyLogbookForInternship({
                        studentId: app.studentId,
                        internshipId: app.internshipId || app.id,
                        companyId: app.companyId || app.companyName || "",
                        advisorId: app.advisorName || "",
                      });
                      const pending = (rec.weeks || []).filter((w) => w.status === WEEK_STATUS.PENDING_ADVISOR);
                      if (pending.length === 0) return null;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => openStudent(app)}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/40 transition flex justify-between items-center gap-4"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{app.studentName}</p>
                            <p className="text-sm text-gray-500">{app.companyName}</p>
                          </div>
                          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {pending.length} week{pending.length !== 1 ? "s" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "monthly" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Monthly Evaluations</h2>
                  <p className="text-gray-600">Company-submitted monthly performance evaluations — pending your approval.</p>
                </div>

                {allMyMonthlyEvals.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No monthly evaluations submitted yet.</p>
                    <p className="text-sm text-gray-400 mt-2">When a company submits a monthly evaluation for one of your students, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allMyMonthlyEvals.map(ev => {
                      const studentApp = assignedStudents.find(a => a.studentId === ev.studentId);
                      const isPending = ev.status === EVAL_STATUS.SUBMITTED;
                      const isApproved = ev.status === EVAL_STATUS.APPROVED;
                      const isRejected = ev.status === EVAL_STATUS.REJECTED;

                      let badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                      if (isApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEval({ eval: ev, studentApp })}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/40 transition flex justify-between items-center gap-4"
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
                              <p className="text-xs text-blue-600 mt-0.5 italic">Your comment: {ev.advisorComment}</p>
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
              </div>
            )}

            {activeTab === "final" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Final Evaluations</h2>
                  <p className="text-gray-600">Company-submitted final internship evaluations — pending your approval.</p>
                </div>

                {allMyFinalEvals.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No final evaluations submitted yet.</p>
                    <p className="text-sm text-gray-400 mt-2">When a company submits a final evaluation for one of your students, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allMyFinalEvals.map(ev => {
                      const studentApp = assignedStudents.find(a => a.studentId === ev.studentId);
                      const isPendingAdvisor = ev.status === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL;
                      const isApprovedByAdvisor = ev.status === FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR;
                      const isPendingExaminer = ev.status === FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL;
                      const isFinalApproved = ev.status === FINAL_EVAL_STATUS.FINAL_APPROVED;
                      const isRejected = ev.status === FINAL_EVAL_STATUS.REJECTED;

                      let badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                      if (isApprovedByAdvisor) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isPendingExaminer) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                      if (isFinalApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedFinalEval({ eval: ev, studentApp })}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/40 transition flex justify-between items-center gap-4"
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
                              <p className="text-xs text-blue-600 mt-0.5 italic">Your comment: {ev.advisorComment}</p>
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
              </div>
            )}

            {activeTab === "documents" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Document queue</h2>
                  <p className="text-gray-600">
                    Internship files uploaded by your students that need your approval (examiner approves separately).
                  </p>
                </div>
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
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
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
                  <span className="text-sm text-gray-600">Pending monthly evals</span>
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

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Workflow
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  Company approves the student week first; then it appears for your approval.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  Use <strong className="text-gray-800">My Students</strong> to open a student and approve or reject each week.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  Monthly evaluations submitted by the company appear in the <strong className="text-gray-800">Monthly Evaluations</strong> tab for your review.
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  Student uploads appear in the <strong className="text-gray-800">Document queue</strong> tab until you approve or reject them.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {selectedStudent && selectedLogbook && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-blue-600" />
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
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setStudentDetailTab("logbook")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${studentDetailTab === "logbook" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <BookOpen className="w-4 h-4" /> Weekly Logbook
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("monthly")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${studentDetailTab === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <ClipboardList className="w-4 h-4" /> Monthly Evaluation
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("final")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${studentDetailTab === "final" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <ClipboardList className="w-4 h-4" /> Final Evaluation
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab("documents")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-sm font-bold transition-all ${studentDetailTab === "documents" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <FileText className="w-4 h-4 shrink-0" /> Documents
              </button>
            </div>

            {/* ── Weekly Logbook tab ── */}
            {studentDetailTab === "logbook" && (
              <div className="space-y-4">
                {selectedLogbook.weeks.filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">This student has not submitted any logbook weeks yet.</p>
                  </div>
                ) : (
                  selectedLogbook.weeks
                    .filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED)
                    .map((week) => {
                      const isPending = week.status === WEEK_STATUS.PENDING_ADVISOR;
                      const isApproved = week.status === WEEK_STATUS.APPROVED;
                      const isRejected = week.status === WEEK_STATUS.REJECTED_ADVISOR;

                      let badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                      if (isApproved) badgeClass = "bg-green-100 text-green-800 border-green-200";
                      if (isRejected) badgeClass = "bg-red-100 text-red-800 border-red-200";
                      if (week.status === WEEK_STATUS.PENDING_COMPANY) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";

                      return (
                        <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 bg-gray-50/30">
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

            {/* ── Monthly Evaluation tab ── */}
            {studentDetailTab === "monthly" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map(month => {
                  const rec = getEvaluation(selectedStudent.studentId, month);
                  const status = rec?.status || EVAL_STATUS.NOT_STARTED;
                  const badgeMap = {
                    [EVAL_STATUS.NOT_STARTED]: "bg-gray-100 text-gray-600 border-gray-200",
                    [EVAL_STATUS.SUBMITTED]:   "bg-blue-100 text-blue-700 border-blue-200",
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
              </div>
            )}

            {/* ── Final Evaluation tab ── */}
            {studentDetailTab === "final" && (
              <div className="space-y-6">
                {(() => {
                  const finalEval = getFinalEvaluation(selectedStudent.studentId);
                  if (!finalEval) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No final evaluation submitted yet by the company.</p>
                      </div>
                    );
                  }

                  const badgeMap = {
                    [FINAL_EVAL_STATUS.NOT_STARTED]: "bg-gray-100 text-gray-600 border-gray-200",
                    [FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL]: "bg-blue-100 text-blue-700 border-blue-200",
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
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-600 mb-1">Total Score</p>
                              <p className="text-2xl font-bold text-blue-700">{finalEval.total} / 60</p>
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
              </div>
            )}

            {studentDetailTab === "documents" && (
              <AdvisorStudentDocumentsPanel
                studentId={selectedStudent.studentId}
                advisorIdentity={advisorIdentity}
              />
            )}
          </div>
        </div>
      )}
      {selectedEval && (
        <div className="fixed inset-0 bg-black/60 z-[190] p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
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
          <div className="max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
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
              readOnly={selectedFinalEval.eval.status !== FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL}
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
          <div className="max-w-2xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
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
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
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
