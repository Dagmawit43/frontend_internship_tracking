import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  User,
  BookOpen,
  Building2,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Eye,
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import { useAuth } from "../contexts/AuthContext";
import InternshipLogbookForm from "./InternshipLogbookForm";
import { WEEK_STATUS, STATUS_LABELS, ensureWeeklyLogbookForInternship } from "../utils/weeklyLogbook";

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
              Logout
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
            <p className="text-xs font-medium opacity-80">Assigned interns</p>
            <p className="text-lg font-bold">{statPrimary ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20">
          <Eye className="w-6 h-6" />
          <div>
            <p className="text-xs font-medium opacity-80">Weeks with activity</p>
            <p className="text-lg font-bold">{statSecondary ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ExaminerDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("examiner"));
    if (!activeSession || activeSession.role !== "Examiner") {
      navigate("/login");
      return;
    }
    setSession(activeSession);
  }, [navigate]);

  const examinerIdentity = useMemo(() => {
    const name = session?.fullName || session?.name || session?.username || "";
    return String(name || "").trim().toLowerCase();
  }, [session]);

  useEffect(() => {
    if (!examinerIdentity) return;
    const loadAssigned = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const active = allApps.filter((app) => {
        const isActiveIntern = app.finalInternshipStatus === "ACTIVE_INTERN";
        const e1 = String(app.examinerName || "").trim().toLowerCase();
        const e2 = String(app.examiner2Name || "").trim().toLowerCase();
        return isActiveIntern && (e1 === examinerIdentity || e2 === examinerIdentity);
      });
      setAssignedStudents(active);
    };
    loadAssigned();
    window.addEventListener("storage", loadAssigned);
    return () => window.removeEventListener("storage", loadAssigned);
  }, [examinerIdentity]);

  const activityWeeksCount = useMemo(() => {
    let n = 0;
    for (const app of assignedStudents) {
      const rec = ensureWeeklyLogbookForInternship({
        studentId: app.studentId,
        internshipId: app.internshipId || app.id,
        companyId: app.companyId || app.companyName || "",
        advisorId: app.advisorName || "",
      });
      n += (rec.weeks || []).filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED).length;
    }
    return n;
  }, [assignedStudents]);

  const openStudent = (studentApp) => {
    const record = ensureWeeklyLogbookForInternship({
      studentId: studentApp.studentId,
      internshipId: studentApp.internshipId || studentApp.id,
      companyId: studentApp.companyId || studentApp.companyName || "",
      advisorId: studentApp.advisorName || "",
    });
    setSelectedStudent(studentApp);
    setSelectedLogbook(record);
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

  const displayName = session?.fullName || session?.name || session?.username || "Examiner";
  const department = session?.department || "";

  return (
    <div className="min-h-screen bg-gray-100">
      <StaffTopNavigation displayName={displayName} roleLabel="Internal Examiner" notificationCount={activityWeeksCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffWelcomeHeader
          name={displayName}
          department={department}
          roleLabel="Internal Examiner"
          subtitle="Monitor internship progress and weekly logbooks for students assigned to you as internal examiner."
          statPrimary={assignedStudents.length}
          statSecondary={activityWeeksCount}
        />

        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-2xl overflow-x-auto scrollbar-hide">
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
            onClick={() => setActiveTab("overview")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "overview" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Logbooks overview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "students" && (
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
                        <p className="text-xs text-gray-500 mt-3 font-medium">Click to view weekly logbooks (read only)</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Logbooks overview</h2>
                  <p className="text-gray-600">Submitted or in-progress weeks per assigned student.</p>
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
                      const activeWeeks = (rec.weeks || []).filter((w) => w.status !== WEEK_STATUS.NOT_SUBMITTED);
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
                          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase bg-gray-100 text-gray-700 border border-gray-200">
                            {activeWeeks.length} / 8 weeks
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
                  <span className="text-sm text-gray-600">Weeks with activity</span>
                  <span className="text-lg font-bold text-blue-600">{activityWeeksCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Your role
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Examiners have read-only access to weekly logbooks for oversight. Academic advisor approvals and company
                reviews are handled in their respective dashboards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedStudent && selectedLogbook && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <p className="text-sm text-gray-500 mt-1">Weekly logbooks — examiner view (read only)</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
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
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedLogbook(null);
                }}
                className="self-start px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedLogbook.weeks.map((week) => (
                <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <p className="font-black text-gray-900">Week {week.weekNumber}</p>
                    <span className="px-2.5 py-1 rounded-full border text-[10px] font-black uppercase bg-gray-100 text-gray-700 border-gray-200">
                      {STATUS_LABELS[week.status]}
                    </span>
                  </div>
                  <InternshipLogbookForm
                    role="viewer"
                    readOnly
                    title={`Week ${week.weekNumber}`}
                    initialData={{
                      studentName: selectedLogbook.meta?.studentName || selectedStudent.studentName || "",
                      companyName: selectedLogbook.meta?.companyName || selectedStudent.companyName || "",
                      supervisorName: selectedLogbook.meta?.supervisorName || "",
                      safetyBrief: selectedLogbook.meta?.safetyBrief || "",
                      weeks: [week],
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerDashboard;
