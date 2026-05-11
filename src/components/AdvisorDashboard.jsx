import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, User, BookOpen } from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";
import InternshipLogbookForm from "./InternshipLogbookForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  ensureWeeklyLogbookForInternship,
  updateWeekForInternship,
} from "../utils/weeklyLogbook";

const AdvisorDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLogbook, setSelectedLogbook] = useState(null);

  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("advisor"));
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

  const openStudent = (studentApp) => {
    const record = ensureWeeklyLogbookForInternship({
      studentId: studentApp.studentId,
      internshipId: studentApp.internshipId || studentApp.id,
      companyId: studentApp.companyId || studentApp.companyName || "",
      advisorId: studentApp.advisorName || session?.username || "",
    });
    setSelectedStudent(studentApp);
    setSelectedLogbook(record);
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
  };

  if (!session) return null;

  const advisorName = session?.fullName || session?.name || session?.username || "Advisor";

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent">
                <div className="bg-blue-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                  {advisorName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{advisorName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Internship Students</h2>
            <p className="text-sm text-gray-500">Review weekly logbooks pending advisor approval.</p>
          </div>

          {assignedStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active internship students are assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedStudents.map((app) => (
                <button
                  key={app.id}
                  onClick={() => openStudent(app)}
                  className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <p className="font-bold text-gray-900">{app.studentName}</p>
                  <p className="text-sm text-gray-600">{app.internshipTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{app.companyName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedStudent && selectedLogbook && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedStudent.studentName} - Weekly Logbooks</h3>
                <p className="text-sm text-gray-500">Showing only weeks pending advisor review.</p>
              </div>
              <button onClick={() => { setSelectedStudent(null); setSelectedLogbook(null); }} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <div className="space-y-4">
              {selectedLogbook.weeks.filter((week) => week.status === WEEK_STATUS.PENDING_ADVISOR).length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No weekly logbooks are pending your approval.</p>
                </div>
              ) : (
                selectedLogbook.weeks
                  .filter((week) => week.status === WEEK_STATUS.PENDING_ADVISOR)
                  .map((week) => (
                    <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <InternshipLogbookForm
                        key={`${selectedStudent.studentId}-w${week.weekNumber}`}
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
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAdvisorDecision(week.weekNumber, "approve")}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvisorDecision(week.weekNumber, "reject")}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorDashboard;
