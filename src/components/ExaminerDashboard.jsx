import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, User, Building2, Briefcase,
  CheckCircle, ClipboardList, X, FileText, LogOut,
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import ExaminerSidebar from "./ExaminerSidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  getExaminerEvaluation,
  submitExaminerEvaluation,
} from "../utils/examinerEvaluations";
import {
  approveOverallAsExaminerSlot,
  computeOverallEvaluation,
  getOverallApprovals,
} from "../utils/overallEvaluation";
import {
  getDocumentsForExaminerStudents,
  examinerDecideInternshipDocument,
  examinerCanReviewDocument,
  ROLE_DOC_STATUS,
} from "../utils/internshipDocuments";
import ExaminerUniversityEvaluationForm from "./ExaminerUniversityEvaluationForm";

const ExaminerStudentDocumentsPanel = ({ studentId, examinerIdentity, displayName }) => {
  const [docs, setDocs] = useState([]);
  const [commentByDoc, setCommentByDoc] = useState({});

  const reload = () => {
    const list = getDocumentsForExaminerStudents(examinerIdentity, [studentId]).filter((d) =>
      examinerCanReviewDocument(d, examinerIdentity)
    );
    setDocs(list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  };

  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, [studentId, examinerIdentity]);

  const decide = (docId, action) => {
    examinerDecideInternshipDocument(
      docId,
      action,
      commentByDoc[docId] || "",
      displayName || examinerIdentity
    );
    reload();
  };

  if (docs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No internship documents from this student for you to review yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Review uploads from this student. The academic advisor also reviews each file independently.
      </p>
      {docs.map((doc) => {
        const pending = doc.examinerStatus === ROLE_DOC_STATUS.PENDING;
        return (
          <div key={doc.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-gray-50/40 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 items-start">
              <div>
                <h4 className="font-bold text-gray-900">{doc.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(doc.submittedAt).toLocaleString()} · Advisor: {doc.advisorStatus}
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
                Your status: {doc.examinerStatus}
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
                {doc.examinerComment && (
                  <span className="block">
                    <strong>Your comment:</strong> {doc.examinerComment}
                  </span>
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ExaminerDocQueueRow = ({ doc, studentApp, examinerIdentity, displayName, onDecided }) => {
  const [comment, setComment] = useState("");
  const pending = doc.examinerStatus === ROLE_DOC_STATUS.PENDING;

  const decide = (action) => {
    examinerDecideInternshipDocument(doc.id, action, comment, displayName || examinerIdentity);
    onDecided?.();
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-gray-50/40 space-y-3">
      <div className="flex flex-wrap justify-between gap-2 items-start">
        <div>
          <h4 className="font-bold text-gray-900">{doc.title}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {studentApp?.studentName || doc.studentName} · {studentApp?.companyName || ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {new Date(doc.submittedAt).toLocaleString()} · Advisor: {doc.advisorStatus}
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
      {pending ? (
        <div className="pt-2 space-y-2 border-t border-gray-100">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
            placeholder="Optional comment for the student"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => decide("approve")}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => decide("reject")}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Your status: <strong>{doc.examinerStatus}</strong>
          {doc.examinerComment && (
            <span className="block mt-1">
              <strong>Comment:</strong> {doc.examinerComment}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

// ─── Top Nav ──────────────────────────────────────────────────────────────────
const StaffTopNavigation = ({ displayName, roleLabel, notificationCount = 0 }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try { logout(); } catch { /* ignore */ }
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
          <button
            type="button"
            className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
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
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex min-w-0 max-w-[160px] items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors sm:max-w-none sm:px-3"
            >
              <span className="truncate text-sm font-medium text-gray-700">{displayName || roleLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-2">
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

// ─── Welcome Header ───────────────────────────────────────────────────────────
const WelcomeHeader = ({ name, department, roleLabel, subtitle, statPrimary }) => (
  <div className="app-hero">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {name || roleLabel}</h1>
        <div className="flex flex-wrap gap-4 text-sm opacity-95">
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20">
        <ClipboardList className="w-6 h-6" />
        <div>
          <p className="text-xs font-medium opacity-80">Assigned interns</p>
          <p className="text-lg font-bold">{statPrimary ?? 0}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── ExaminerDashboard ────────────────────────────────────────────────────────
const ExaminerDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examinerEvalNonce, setExaminerEvalNonce] = useState(0);
  const [mainTab, setMainTab] = useState("students");
  const [studentModalTab, setStudentModalTab] = useState("eval");
  const [docQueueNonce, setDocQueueNonce] = useState(0);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("user"));
    if (!s || s.role !== "Examiner") {
      navigate("/login");
      return;
    }
    setSession(s);
  }, [navigate]);

  const examinerIdentity = session
    ? String(session.fullName || session.name || session.username || "").trim().toLowerCase()
    : "";

  useEffect(() => {
    if (!examinerIdentity) return;
    const load = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const active = allApps.filter((app) => {
        if (app.finalInternshipStatus !== "ACTIVE_INTERN") return false;
        const e1 = String(app.examinerName || "").trim().toLowerCase();
        const e2 = String(app.examiner2Name || "").trim().toLowerCase();
        return e1 === examinerIdentity || e2 === examinerIdentity;
      });
      setAssignedStudents(active);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [examinerIdentity]);

  useEffect(() => {
    const bump = () => {
      setExaminerEvalNonce((n) => n + 1);
      setDocQueueNonce((n) => n + 1);
    };
    window.addEventListener("storage", bump);
    window.addEventListener("examiner-evaluation-updated", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("examiner-evaluation-updated", bump);
    };
  }, []);

  const assignedStudentIds = useMemo(() => assignedStudents.map((a) => a.studentId), [assignedStudents]);

  const pendingExaminerDocuments = useMemo(() => {
    if (!examinerIdentity) return [];
    return getDocumentsForExaminerStudents(examinerIdentity, assignedStudentIds).filter(
      (d) => d.examinerStatus === ROLE_DOC_STATUS.PENDING
    );
  }, [examinerIdentity, assignedStudentIds, docQueueNonce]);

  const examinerOwnEval = useMemo(() => {
    if (!selectedStudent || !examinerIdentity) return null;
    return getExaminerEvaluation(selectedStudent.studentId, examinerIdentity);
  }, [selectedStudent, examinerIdentity, examinerEvalNonce]);

  const overall = useMemo(() => {
    if (!selectedStudent) return null;
    return computeOverallEvaluation(selectedStudent);
  }, [selectedStudent, examinerEvalNonce]);

  const overallApprovals = useMemo(() => {
    if (!selectedStudent) return null;
    return getOverallApprovals(selectedStudent.studentId);
  }, [selectedStudent, examinerEvalNonce, docQueueNonce]);

  const examinerSlot = useMemo(() => {
    if (!selectedStudent || !examinerIdentity) return null;
    const e1 = String(selectedStudent.examinerName || "").trim().toLowerCase();
    const e2 = String(selectedStudent.examiner2Name || "").trim().toLowerCase();
    if (e1 && e1 === examinerIdentity) return 1;
    if (e2 && e2 === examinerIdentity) return 2;
    return null;
  }, [selectedStudent, examinerIdentity]);

  const examinerEvalFormInitial = useMemo(() => {
    if (!selectedStudent || !session) return {};
    const rec = examinerOwnEval;
    const dn = session.fullName || session.name || session.username || "Examiner";
    return {
      ...(rec?.formData || {}),
      studentName: selectedStudent.studentName || "",
      idNo: selectedStudent.studentId || "",
      department: selectedStudent.department || "",
      organization: selectedStudent.companyName || "",
      examinerName: rec?.formData?.examinerName || dn,
    };
  }, [selectedStudent, examinerOwnEval, session]);

  if (!session) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = session.fullName || session.name || session.username || "Examiner";
  const department = session.department || "";

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <StaffTopNavigation
        displayName={displayName}
        roleLabel="Internal Examiner"
        notificationCount={pendingExaminerDocuments.length}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ExaminerSidebar
          currentView={mainTab}
          onNavigate={setMainTab}
          staffName={displayName}
          pendingDocs={pendingExaminerDocuments.length}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WelcomeHeader
          name={displayName}
          department={department}
          roleLabel="Internal Examiner"
          subtitle="Review assigned students, submit examiner evaluations, and clear your document queue."
          statPrimary={assignedStudents.length}
        />

        {mainTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="app-card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Assigned internship students</h2>
                  <p className="text-gray-600">Active placements where you are the internal examiner.</p>
                </div>

                {assignedStudents.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No students are assigned to you as examiner yet.</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                      When a coordinator assigns you on an active internship application, students will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignedStudents.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          setStudentModalTab("eval");
                          setSelectedStudent(app);
                        }}
                        className="rounded-xl border border-slate-200/90 bg-indigo-50/50 p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
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
                        <p className="text-xs text-gray-500 mt-3 font-medium">Click for evaluation &amp; documents</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="app-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick stats</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned students</span>
                  <span className="text-lg font-bold text-gray-900">{assignedStudents.length}</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-600">Pending documents</span>
                  <span className="text-lg font-bold text-amber-600">{pendingExaminerDocuments.length}</span>
                </div>
              </div>

              <div className="app-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Your role
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Open a student to fill the examiner evaluation and review their internship documents. Use{" "}
                  <strong className="text-gray-800">Document queue</strong> for all pending files across students.
                </p>
              </div>
            </div>
          </div>
        )}

        {mainTab === "doc-queue" && (
          <div className="app-card p-6 max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Document queue</h2>
              <p className="text-gray-600">
                Student uploads that need your approval (advisor approves separately).
              </p>
            </div>
            {assignedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students assigned.</div>
            ) : pendingExaminerDocuments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents waiting for your review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingExaminerDocuments.map((doc) => {
                  const studentApp = assignedStudents.find((a) => String(a.studentId) === String(doc.studentId));
                  return (
                    <ExaminerDocQueueRow
                      key={doc.id}
                      doc={doc}
                      studentApp={studentApp}
                      examinerIdentity={examinerIdentity}
                      displayName={displayName}
                      onDecided={() => setDocQueueNonce((n) => n + 1)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="app-modal-panel mx-auto my-8 max-w-5xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <p className="text-sm text-gray-500 mt-1">Examiner workspace</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentModalTab("eval");
                }}
                className="self-start p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="app-tab-shell mb-6">
              <button
                type="button"
                onClick={() => setStudentModalTab("eval")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                  studentModalTab === "eval" ? "app-tab-active" : "app-tab-inactive"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Examiner evaluation
              </button>
              <button
                type="button"
                onClick={() => setStudentModalTab("documents")}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                  studentModalTab === "documents" ? "app-tab-active" : "app-tab-inactive"
                }`}
              >
                <FileText className="w-4 h-4" />
                Documents
              </button>
              {overallApprovals?.advisorApproved && (
                <button
                  type="button"
                  onClick={() => setStudentModalTab("overall")}
                  className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                    studentModalTab === "overall" ? "app-tab-active" : "app-tab-inactive"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Overall report
                </button>
              )}
            </div>

            {studentModalTab === "eval" && (
              <div>
                {examinerOwnEval?.submittedAt && (
                  <p className="text-sm text-gray-500 mb-4">
                    Last submitted {new Date(examinerOwnEval.submittedAt).toLocaleString()} — you can update and submit again.
                  </p>
                )}
                <ExaminerUniversityEvaluationForm
                  key={`${selectedStudent.studentId}-${examinerOwnEval?.updatedAt || "new"}`}
                  initialData={examinerEvalFormInitial}
                  onSubmit={(formPayload) => {
                    submitExaminerEvaluation({
                      studentId: selectedStudent.studentId,
                      studentName: selectedStudent.studentName,
                      examinerKey: examinerIdentity,
                      examinerName: displayName,
                      advisorName: selectedStudent.advisorName || "",
                      formData: formPayload,
                    });
                    setExaminerEvalNonce((n) => n + 1);
                  }}
                />
              </div>
            )}

            {studentModalTab === "documents" && examinerIdentity && (
              <ExaminerStudentDocumentsPanel
                studentId={selectedStudent.studentId}
                examinerIdentity={examinerIdentity}
                displayName={displayName}
              />
            )}

            {studentModalTab === "overall" && overallApprovals?.advisorApproved && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Overall report (advisor-approved)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      This appears after the advisor approves the overall evaluation. Your approval is required for coordinator finalization.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase">Overall mark</p>
                    <p className="text-2xl font-black text-green-700">
                      {overall?.overallMark100 ?? "—"} / 100
                    </p>
                    {overall?.companyTotal40 != null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Company: {overall.companyTotal40} / 40
                      </p>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                  <h5 className="font-bold text-gray-900">Approval status</h5>
                  <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                    <span className={`px-3 py-1 rounded-full border ${overallApprovals.advisorApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      Advisor: {overallApprovals.advisorApproved ? "Approved" : "Pending"}
                    </span>
                    <span className={`px-3 py-1 rounded-full border ${overallApprovals.examiner1Approved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      Examiner 1: {overallApprovals.examiner1Approved ? "Approved" : "Pending"}
                    </span>
                    <span className={`px-3 py-1 rounded-full border ${overallApprovals.examiner2Approved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      Examiner 2: {overallApprovals.examiner2Approved ? "Approved" : "Pending"}
                    </span>
                    <span className={`px-3 py-1 rounded-full border ${overallApprovals.coordinatorApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      Coordinator: {overallApprovals.coordinatorApproved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  {examinerSlot === 1 && !overallApprovals.examiner1Approved && (
                    <button
                      type="button"
                      disabled={!overall?.complete}
                      onClick={() => approveOverallAsExaminerSlot(selectedStudent.studentId, 1)}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Approve overall (Examiner 1)
                    </button>
                  )}
                  {examinerSlot === 2 && !overallApprovals.examiner2Approved && (
                    <button
                      type="button"
                      disabled={!overall?.complete}
                      onClick={() => approveOverallAsExaminerSlot(selectedStudent.studentId, 2)}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Approve overall (Examiner 2)
                    </button>
                  )}
                  {!overall?.complete && (
                    <p className="text-xs text-gray-500">
                      Your approval becomes available after advisor + both examiner evaluations and company evaluations are complete.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerDashboard;
