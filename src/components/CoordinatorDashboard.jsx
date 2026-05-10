import React, { useState, useEffect } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";

const getValidSession = () => {
  try {
    // Try every key that could hold a coordinator session
    const candidates = ["coordinator", "activeStaffUser", "user"];
    for (const key of candidates) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === "null" || raw === "undefined") continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        // Must have at least one identifying field
        if (parsed.fullName || parsed.name || parsed.username || parsed.email || parsed.department) {
          return parsed;
        }
      } catch { continue; }
    }
    return {};
  } catch (e) {
    return {};
  }
};

export const getCoordinatorDepartment = () => {
  const session = getValidSession();
  return (session.department || "Department").toString().trim();
};

export const getCoordinatorName = () => {
  const session = getValidSession();
  return session.fullName || session.name || session.username || session.email || "Coordinator";
};

// ─── Student Management Sub-view ───────────────────────────────────────────
const StudentManagementView = ({ coordinatorDept, onBack }) => {
  const [activeStudents, setActiveStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);

  useEffect(() => {
    // Use the passed coordinatorDept prop directly (resolved by parent from coordinator session).
    // Do NOT re-read localStorage here — localStorage.user may hold a student's session
    // (from the student's last login), which would corrupt the department filter.
    // As a safety net, only accept a session with role === "Coordinator".
    const safeSession = (() => {
      try {
        const raw = localStorage.getItem("coordinator");
        if (!raw || raw === "null") return null;
        const p = JSON.parse(raw);
        if (p && String(p.role || "").toLowerCase() === "coordinator") return p;
      } catch { /**/ }
      return null;
    })();
    const dept = (safeSession?.department || coordinatorDept || "").trim();

    const allEligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
    const allRegistered = JSON.parse(localStorage.getItem("students") || "[]");

    const normalize = (s) => String(s || "").trim().toLowerCase();

    const deptEligible = allEligible.filter(s => normalize(s.department) === normalize(dept));
    const deptRegistered = allRegistered.filter(s => normalize(s.department) === normalize(dept));

    const registeredIds = new Set(deptRegistered.map(s => normalize(s.studentId)));
    const pending = deptEligible.filter(s => !registeredIds.has(normalize(s.studentId)));

    setActiveStudents(deptRegistered);
    setPendingStudents(pending);
  }, [coordinatorDept]);

  // Derive display dept from session for the heading
  const displayDept = coordinatorDept || "your department";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Department Students</h2>
          <p className="text-sm text-gray-500 mt-0.5">Showing students in: <strong>{displayDept}</strong></p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active */}
        <div className="bg-white border rounded-lg shadow-sm border-green-200">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold text-green-900">Active (Signed Up)</h3>
            <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-bold">{activeStudents.length}</span>
          </div>
          <div className="p-4 space-y-3">
            {activeStudents.length === 0
              ? <p className="text-sm text-gray-500">No students are actively registered yet.</p>
              : activeStudents.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{s.fullName}</div>
                    <div className="text-xs text-gray-500">{s.studentId} • {s.email}</div>
                  </div>
                  <div className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded">Active</div>
                </div>
              ))}
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border rounded-lg shadow-sm border-yellow-200">
          <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200 flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold text-yellow-900">Eligible (Not Signed Up)</h3>
            <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">{pendingStudents.length}</span>
          </div>
          <div className="p-4 space-y-3">
            {pendingStudents.length === 0
              ? <p className="text-sm text-gray-500">All eligible students have registered.</p>
              : pendingStudents.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{s.fullName}</div>
                    <div className="text-xs text-gray-500">{s.studentId} • {s.email}</div>
                  </div>
                  <div className="text-xs text-yellow-600 font-medium px-2 py-1 bg-yellow-100 rounded">Pending</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Coordinator Dashboard ─────────────────────────────────────────────
const CoordinatorDashboard = () => {
  const [coordinatorDept] = useState(getCoordinatorDepartment());
  const [coordinatorName] = useState(getCoordinatorName());
  const [mockStaff, setMockStaff] = useState([]);
  const [assignedAdvisors, setAssignedAdvisors] = useState(() => {
    const dept = getCoordinatorDepartment();
    const all = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
    return all.filter(s => String(s.department || "").trim().toLowerCase() === String(dept).trim().toLowerCase());
  });
  const [assignedExaminers, setAssignedExaminers] = useState(() => {
    const dept = getCoordinatorDepartment();
    const all = JSON.parse(localStorage.getItem("assignedExaminers") || "[]");
    return all.filter(s => String(s.department || "").trim().toLowerCase() === String(dept).trim().toLowerCase());
  });
  const [view, setView] = useState("home");
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try { logout(); } catch (e) { /* ignore */ }
    navigate("/login");
  };

  const addPendingInvitation = (staff, role) => {
    try {
      const existing = JSON.parse(localStorage.getItem("pendingInvitations") || "[]");
      const filtered = existing.filter(inv => inv.email !== staff.email);
      localStorage.setItem("pendingInvitations", JSON.stringify([
        ...filtered,
        { email: staff.email, role, department: staff.department, status: "pending" }
      ]));
    } catch (e) { console.error(e); }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 4000);
  };

  const assignAsAdvisor = (staff) => {
    const updatedStaff = { ...staff, status: "Advisor" };
    
    // 1. Update localStorage globally (safe merge)
    const allGlobalAdvisors = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
    const filteredGlobal = allGlobalAdvisors.filter(a => a.id !== updatedStaff.id && a.email !== updatedStaff.email);
    localStorage.setItem("assignedAdvisors", JSON.stringify([...filteredGlobal, updatedStaff]));

    // 2. Update local state (ui only)
    setMockStaff(prev => prev.filter(s => s.id !== staff.id && s.email !== staff.email));
    setAssignedAdvisors(prev => [...prev.filter(a => a.id !== updatedStaff.id), updatedStaff]);
    
    addPendingInvitation(staff, "Advisor");
    showToast(`Invitation email sent to ${staff.email}. They can now register as an Advisor.`);
  };

  const assignAsExaminer = (staff) => {
    const updatedStaff = { ...staff, status: "Examiner" };

    // 1. Update localStorage globally (safe merge)
    const allGlobalExaminers = JSON.parse(localStorage.getItem("assignedExaminers") || "[]");
    const filteredGlobal = allGlobalExaminers.filter(e => e.id !== updatedStaff.id && e.email !== updatedStaff.email);
    localStorage.setItem("assignedExaminers", JSON.stringify([...filteredGlobal, updatedStaff]));

    // 2. Update local state (ui only)
    setMockStaff(prev => prev.filter(s => s.id !== staff.id && s.email !== staff.email));
    setAssignedExaminers(prev => [...prev.filter(e => e.id !== updatedStaff.id), updatedStaff]);

    addPendingInvitation(staff, "Examiner");
    showToast(`Invitation email sent to ${staff.email}. They can now register as an Examiner.`);
  };

  const handleFileUpload = () => {
    setFileError("");
    setFileSuccess("");
    if (!selectedFile) { setFileError("Please select a JSON file first."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) { setFileError("Invalid student file format"); return; }
        const valid = data.every(item => item.studentId && item.fullName && item.email && item.department);
        if (!valid) { setFileError("Invalid student file format"); return; }
        localStorage.setItem("eligibleStudents", JSON.stringify(data));
        setFileSuccess("Eligible students uploaded successfully");
        setSelectedFile(null);
      } catch { setFileError("Invalid student file format"); }
    };
    reader.onerror = () => setFileError("Failed to read file.");
    reader.readAsText(selectedFile);
  };

  // Populate mockStaff on mount, subtract already-assigned ones (dept-scoped)
  useEffect(() => {
    const dept = coordinatorDept || "Department";
    const key = dept.toString().replace(/\s+/g, "").toLowerCase();

    // Only subtract staff that belong to THIS coordinator's department
    const currAdvisors = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
    const currExaminers = JSON.parse(localStorage.getItem("assignedExaminers") || "[]");
    const deptNorm = key;

    const deptAdvisors = currAdvisors.filter(a => String(a.department || "").trim().toLowerCase() === deptNorm);
    const deptExaminers = currExaminers.filter(e => String(e.department || "").trim().toLowerCase() === deptNorm);

    // Build sets for both IDs and emails — handles old generic IDs and new namespaced IDs
    const assignedIds = new Set([
      ...deptAdvisors.map(a => a.id),
      ...deptExaminers.map(e => e.id),
    ]);
    const assignedEmails = new Set([
      ...deptAdvisors.map(a => String(a.email || "").toLowerCase()),
      ...deptExaminers.map(e => String(e.email || "").toLowerCase()),
    ]);

    // Use dept-namespaced IDs so each coordinator has their own independent pool
    const staff = Array.from({ length: 10 }).map((_, i) => {
      const idx = i + 1;
      return {
        id: `${key}-staff-${idx}`,
        name: `${dept}Staff${idx}`,
        email: `${key}staff${idx}@mock.com`,
        department: dept,
        status: "unassigned",
      };
    }).filter(s => !assignedIds.has(s.id) && !assignedEmails.has(s.email.toLowerCase()));

    setMockStaff(staff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Top Nav */}
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
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Logout
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{coordinatorName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-[100] animate-bounce-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border-2 border-green-400">
            <div className="bg-white/20 p-1 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome, {coordinatorName}</h1>
              <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-90">
                <span>Department: <strong>{coordinatorDept}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10">
              <div>
                <p className="text-xs font-medium opacity-80">Role</p>
                <p className="text-sm font-bold">Coordinator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">

          {/* HOME – navigation buttons */}
          {view === "home" && (
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 transition" onClick={() => setView("staff")}>
                View Staff List
              </button>
              <button className="bg-green-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-green-700 transition" onClick={() => setView("advisors")}>
                Assigned Advisors
              </button>
              <button className="bg-purple-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-purple-700 transition" onClick={() => setView("examiners")}>
                Assigned Examiners
              </button>
              <button className="bg-yellow-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-yellow-700 transition" onClick={() => setView("students")}>
                Manage Students
              </button>
              <button className="bg-indigo-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-indigo-700 transition"
                onClick={() => { setView("upload"); setFileError(""); setFileSuccess(""); setSelectedFile(null); }}>
                Upload Eligible Students
              </button>
            </div>
          )}

          {/* STUDENTS */}
          {view === "students" && (
            <StudentManagementView coordinatorDept={coordinatorDept} onBack={() => setView("home")} />
          )}

          {/* UPLOAD */}
          {view === "upload" && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Eligible Students</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => setView("home")}>← Back</button>
              </div>
              {fileError && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">{fileError}</div>}
              {fileSuccess && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md text-sm">{fileSuccess}</div>}
              <div className="border shadow-sm rounded-lg p-6 bg-gray-50 border-gray-200 space-y-4">
                <label className="block text-sm font-medium text-gray-700">Select JSON File</label>
                <input
                  type="file" accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button onClick={handleFileUpload} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 font-medium transition">
                  Upload
                </button>
              </div>
            </div>
          )}

          {/* STAFF LIST */}
          {view === "staff" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Unassigned Staff List</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => setView("home")}>← Back</button>
              </div>
              {mockStaff.length === 0
                ? <p className="text-gray-500 py-4">No unassigned staff available.</p>
                : (
                  <div className="space-y-3">
                    {mockStaff.map((s) => (
                      <div key={s.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => assignAsAdvisor(s)} className="text-sm font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 transition">
                            Assign Advisor
                          </button>
                          <button onClick={() => assignAsExaminer(s)} className="text-sm font-medium bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 transition">
                            Assign Examiner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ASSIGNED ADVISORS */}
          {view === "advisors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assigned Advisors</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => setView("home")}>← Back</button>
              </div>
              {assignedAdvisors.length === 0
                ? <p className="text-gray-500 py-4">No advisors have been assigned yet.</p>
                : (
                  <div className="space-y-3">
                    {assignedAdvisors.map((s) => (
                      <div key={s.id} className="p-4 rounded-lg bg-white border border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.email}</div>
                        </div>
                        <div className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">{s.status}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ASSIGNED EXAMINERS */}
          {view === "examiners" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assigned Examiners</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => setView("home")}>← Back</button>
              </div>
              {assignedExaminers.length === 0
                ? <p className="text-gray-500 py-4">No examiners have been assigned yet.</p>
                : (
                  <div className="space-y-3">
                    {assignedExaminers.map((s) => (
                      <div key={s.id} className="p-4 rounded-lg bg-white border border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.email}</div>
                        </div>
                        <div className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">{s.status}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
