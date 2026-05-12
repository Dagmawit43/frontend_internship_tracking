import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, User, Building2, Briefcase,
  CheckCircle, ClipboardList, Eye, X,
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import { useAuth } from "../contexts/AuthContext";
import InternshipEvaluationForm from "./InternshipEvaluationForm";
import {
  FINAL_EVAL_STATUS,
  FINAL_EVAL_STATUS_LABELS,
  getAllFinalEvaluations,
  getPendingExaminerFinalEvaluations,
  examinerDecideFinalEvaluation,
} from "../utils/finalEvaluations";

// ─── Top Nav ──────────────────────────────────────────────────────────────────
const StaffTopNavigation = ({ displayName, roleLabel }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try { logout(); } catch { /* ignore */ }
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
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Logout
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{displayName || roleLabel}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
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

// ─── Welcome Header ───────────────────────────────────────────────────────────
const WelcomeHeader = ({ name, department, roleLabel, subtitle, statPrimary }) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
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
        {subtitle && <p className="text-sm text-blue-100 mt-3 max-w-xl">{subtitle}</p>}
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

  // Auth check
  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("user"));
    if (!s || s.role !== "Examiner") {
      navigate("/login");
      return;
    }
    setSession(s);
  }, [navigate]);

  // Derive examiner identity after session loads
  const examinerIdentity = session
    ? String(session.fullName || session.name || session.username || "").trim().toLowerCase()
    : "";

  // Load assigned students
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

  // Loading state
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

  const displayName = session.fullName || session.name || session.username || "Examiner";
  const department  = session.department || "";

  return (
    <div className="min-h-screen bg-gray-100">
      <StaffTopNavigation displayName={displayName} roleLabel="Internal Examiner" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeHeader
          name={displayName}
          department={department}
          roleLabel="Internal Examiner"
          subtitle="View the list of students assigned to you as internal examiner."
          statPrimary={assignedStudents.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
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
                      onClick={() => setSelectedStudent(app)}
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
                      <p className="text-xs text-gray-500 mt-3 font-medium">Click to view student details</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick stats</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assigned students</span>
                <span className="text-lg font-bold text-gray-900">{assignedStudents.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Your role
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                As an internal examiner you can view the list of students assigned to you.
                Logbook reviews and approvals are handled by the academic advisor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student detail modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto my-16 bg-white rounded-xl shadow-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <p className="text-sm text-gray-500 mt-1">Student profile</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Internship title</p>
                  <p className="text-gray-900 font-semibold">{selectedStudent.internshipTitle || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Company</p>
                  <p className="text-gray-900 font-semibold">{selectedStudent.companyName || "—"}</p>
                </div>
              </div>
              {selectedStudent.department && (
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Department</p>
                    <p className="text-gray-900 font-semibold">{selectedStudent.department}</p>
                  </div>
                </div>
              )}
              {selectedStudent.advisorName && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Academic advisor</p>
                    <p className="text-gray-900 font-semibold">{selectedStudent.advisorName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Status</p>
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    Active Intern
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerDashboard;
