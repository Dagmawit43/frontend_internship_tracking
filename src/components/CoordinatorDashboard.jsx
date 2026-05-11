import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, CheckCircle, XCircle, User, Building2, Briefcase, GraduationCap, Clock, Layers, Search, Filter, MapPin, FileText, Eye, BookOpen, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import InternshipAcceptanceForm from "./InternshipAcceptanceForm";
import InternshipLogbookForm from "./InternshipLogbookForm";
import InternshipMonthlyEvaluation from "./InternshipMonthlyEvaluation";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  ensureWeeklyLogbookForInternship,
} from "../utils/weeklyLogbook";
import {
  EVAL_STATUS,
  EVAL_STATUS_LABELS,
  getEvaluation,
} from "../utils/monthlyEvaluations";

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

// ─── Internship Students Approval Sub-view ───────────────────────────────────
const InternshipStudentsView = ({ coordinatorDept, onBack }) => {
  const [pendingApps, setPendingApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const loadApps = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const students = JSON.parse(localStorage.getItem("students")) || [];
      const internships = JSON.parse(localStorage.getItem("allInternships")) || [];
      const companies = JSON.parse(localStorage.getItem("companies")) || [];
      
      const filtered = allApps.filter(app => {
        if (app.coordinatorApprovalStatus !== "PENDING") return false;
        
        const student = students.find(s => s.studentId === app.studentId || s.name === app.studentName);
        if (!student) return false;
        
        const sDept = String(student.department || "").trim().toLowerCase();
        const cDept = String(coordinatorDept || "").trim().toLowerCase();
        return sDept === cDept;
      }).map(app => {
        const student = students.find(s => s.studentId === app.studentId || s.name === app.studentName);
        const internship = internships.find(i => i.id === app.internshipId);
        const company = companies.find(c => c.company_id === app.companyId || c.id === app.companyId || c.companyName === app.companyName);
        
        return {
          ...app,
          studentFull: student,
          internshipFull: internship,
          companyFull: company
        };
      });
      
      setPendingApps(filtered);
    };

    loadApps();
    window.addEventListener("storage", loadApps);
    return () => window.removeEventListener("storage", loadApps);
  }, [coordinatorDept]);

  const handleAction = (app, action) => {
    if (action === "REJECT" && !window.confirm("Are you sure you want to REJECT this internship placement?")) return;
    
    try {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const updatedApps = allApps.map(a => {
        if (a.id === app.id) {
          if (action === "APPROVE") {
            return {
              ...a,
              coordinatorApprovalStatus: "APPROVED",
              finalInternshipStatus: "ACTIVE_INTERN",
              status: "ACTIVE"
            };
          } else {
            return {
              ...a,
              coordinatorApprovalStatus: "REJECTED"
            };
          }
        }
        return a;
      });
      
      localStorage.setItem("applications", JSON.stringify(updatedApps));
      
      if (action === "APPROVE") {
        const students = JSON.parse(localStorage.getItem("students")) || [];
        const updatedStudents = students.map(s => {
          if (s.studentId === app.studentId || s.name === app.studentName) {
            return { ...s, finalInternshipStatus: "ACTIVE_INTERN" };
          }
          return s;
        });
        localStorage.setItem("students", JSON.stringify(updatedStudents));
      }

      alert(`Application ${action === "APPROVE" ? "Approved" : "Rejected"} successfully.`);
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internship Approvals</h2>
          <p className="text-gray-500">Forensic review of student internship selections for {coordinatorDept}</p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={onBack}>
          ← Back
        </button>
      </div>

      {pendingApps.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Pending Approvals</h3>
          <p className="text-gray-500">Everything is caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingApps.map(app => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg h-fit">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{app.studentName}</h3>
                    <p className="text-sm text-gray-500 mb-4">ID: {app.studentId}</p>
                    
                    <div className="flex flex-wrap gap-4">
                       <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-bold">{app.companyName}</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="font-bold">{app.internshipTitle}</span>
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end lg:self-center">
                  <button 
                    onClick={() => setSelectedApp(app)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Review Details
                  </button>
                  <button 
                    onClick={() => handleAction(app, "APPROVE")}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-shadow shadow-lg shadow-green-100 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Fast Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forensic Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
             {/* Header */}
             <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Placement Forensic Review</h3>
                   <p className="text-xs text-gray-500 font-bold">Reviewing Application ID: {selectedApp.id}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <XCircle className="w-6 h-6 text-gray-400" />
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   
                   {/* Student Information */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-600 w-fit">
                         <User className="w-5 h-5 text-blue-600" />
                         <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Student Profile</h4>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Full Name</p>
                            <p className="font-bold text-gray-900 text-lg">{selectedApp.studentName}</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase">Student ID</p>
                               <p className="text-sm font-bold">{selectedApp.studentId}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase">Department</p>
                               <p className="text-sm font-bold">{selectedApp.studentFull?.department || "N/A"}</p>
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Email Address</p>
                            <p className="text-sm font-bold text-blue-600">{selectedApp.studentFull?.email || "N/A"}</p>
                         </div>
                      </div>
                      
                      {selectedApp.additionalDocument && (
                         <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="bg-white p-2 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
                               <div>
                                  <p className="text-xs font-bold text-gray-900">CV / Resume Uploaded</p>
                                  <p className="text-[10px] text-gray-500">{selectedApp.documentName || "Student_CV.pdf"}</p>
                               </div>
                            </div>
                            <a 
                              href={selectedApp.additionalDocument} 
                              download={selectedApp.documentName || "CV.pdf"}
                              className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                            >
                               View CV
                            </a>
                         </div>
                      )}
                   </div>

                   {/* Internship & Company Details */}
                   <div className="space-y-8">
                      {/* Internship Details */}
                      <div>
                        <div className="flex items-center gap-3 pb-2 border-b-2 border-purple-600 w-fit mb-6">
                           <Briefcase className="w-5 h-5 text-purple-600" />
                           <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Internship Details</h4>
                        </div>
                        <div className="space-y-4">
                           <h5 className="text-2xl font-black text-gray-900 leading-tight">{selectedApp.internshipTitle}</h5>
                           <p className="text-sm text-gray-600 leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                              {selectedApp.internshipFull?.description || "No description available."}
                           </p>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 border border-gray-100 rounded-lg">
                                 <p className="text-[10px] font-black text-gray-400 uppercase">Duration</p>
                                 <p className="text-xs font-bold">{selectedApp.internshipFull?.start_date} to {selectedApp.internshipFull?.end_date}</p>
                              </div>
                              <div className="p-3 border border-gray-100 rounded-lg">
                                 <p className="text-[10px] font-black text-gray-400 uppercase">Commitment</p>
                                 <p className="text-xs font-bold">{selectedApp.internshipFull?.total_hours || selectedApp.internshipFull?.Total_hours} Hrs / {selectedApp.internshipFull?.days_in_week || selectedApp.internshipFull?.Days_in_week} Days</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Company Profile */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 pb-2 border-b-2 border-green-600 w-fit mb-6">
                           <Building2 className="w-5 h-5 text-green-600" />
                           <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Company Profile</h4>
                        </div>
                        <div className="space-y-3">
                           <p className="text-xl font-bold text-gray-900">{selectedApp.companyName}</p>
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{selectedApp.companyFull?.location || "Location not specified"}</span>
                           </div>
                           <p className="text-xs text-gray-500 italic">"{selectedApp.companyFull?.description || "Company has not provided a detailed description."}"</p>
                        </div>
                      </div>
                   </div>

                </div>

                {/* Statement of Interest */}
                <div className="mt-10 p-6 bg-yellow-50 border border-yellow-100 rounded-2xl">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-700 mb-2">Student's Statement of Interest</h4>
                   <p className="text-gray-800 leading-relaxed italic">"{selectedApp.reason || "No statement provided."}"</p>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-3">
                    Completed Internship Hosting Company Acceptance Form
                  </h4>
                  <InternshipAcceptanceForm
                    initialData={selectedApp.acceptanceForm}
                    readOnly
                    showActions
                  />
                </div>
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t bg-gray-50 flex gap-4">
                <button 
                   onClick={() => handleAction(selectedApp, "REJECT")}
                   className="flex-1 py-4 border-2 border-red-200 text-red-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-50 transition-all"
                >
                   Decline Placement
                </button>
                <button 
                   onClick={() => handleAction(selectedApp, "APPROVE")}
                   className="flex-[2] py-4 bg-green-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                >
                   Final Approval & Activate Internship
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Coordinator Dashboard ─────────────────────────────────────────────
// ─── Active Interns Management (Advisor/Examiner Assignment) ───────────
const ActiveInternsManagementView = ({ coordinatorDept, onBack }) => {
  const [activeInterns, setActiveInterns] = useState([]);
  const [advisorsPool, setAdvisorsPool] = useState([]);
  const [examinersPool, setExaminersPool] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [internDetailTab, setInternDetailTab] = useState("logbook");
  const [logbookRecord, setLogbookRecord] = useState(null);

  useEffect(() => {
    const loadData = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const students = JSON.parse(localStorage.getItem("students")) || [];
      
      const filtered = allApps.filter(app => {
        if (app.finalInternshipStatus !== "ACTIVE_INTERN") return false;
        const student = students.find(s => s.studentId === app.studentId || s.name === app.studentName);
        if (!student) return false;
        return String(student.department || "").trim().toLowerCase() === String(coordinatorDept || "").trim().toLowerCase();
      });
      
      setActiveInterns(filtered);

      const normalize = (value) => String(value || "").trim().toLowerCase();
      const dept = normalize(coordinatorDept);
      const advisors = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]").filter(
        (a) => normalize(a.department) === dept
      );
      const examiners = JSON.parse(localStorage.getItem("assignedExaminers") || "[]").filter(
        (e) => normalize(e.department) === dept
      );
      
      setAdvisorsPool(advisors);
      setExaminersPool(examiners);
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [coordinatorDept]);

  const handleUpdateAssignment = (appId, field, name) => {
    if (!name) return;
    const allApps = JSON.parse(localStorage.getItem("applications")) || [];
    const updatedApps = allApps.map((app) => {
      if (app.id !== appId) return app;

      const advisor = (app.advisorName || "").trim();
      const ex1 = (app.examinerName || "").trim();
      const ex2 = (app.examiner2Name || "").trim();
      const next = { ...app, [field]: name };

      const conflictsAdvisor =
        field === "advisorName" &&
        (name === ex1 || name === ex2);
      const conflictsExaminer1 =
        field === "examinerName" &&
        (name === advisor || name === ex2);
      const conflictsExaminer2 =
        field === "examiner2Name" &&
        (name === advisor || name === ex1);
      const duplicateExaminers =
        (field === "examinerName" || field === "examiner2Name") &&
        field === "examinerName" &&
        name === ex2;
      const duplicateExaminers2 =
        (field === "examinerName" || field === "examiner2Name") &&
        field === "examiner2Name" &&
        name === ex1;

      if (conflictsAdvisor || conflictsExaminer1 || conflictsExaminer2) {
        alert("Error: Advisor and examiners must be different people.");
        return app;
      }
      if (duplicateExaminers || duplicateExaminers2) {
        alert("Error: The two internal examiners cannot be the same person.");
        return app;
      }

      return next;
    });
    localStorage.setItem("applications", JSON.stringify(updatedApps));
    window.dispatchEvent(new Event("storage"));
  };

  const clearAssignment = (appId, field) => {
    const allApps = JSON.parse(localStorage.getItem("applications")) || [];
    const updatedApps = allApps.map(app => app.id === appId ? { ...app, [field]: "" } : app);
    localStorage.setItem("applications", JSON.stringify(updatedApps));
    window.dispatchEvent(new Event("storage"));
  };

  const openInternDetail = (app) => {
    const record = ensureWeeklyLogbookForInternship({
      studentId: app.studentId,
      internshipId: app.internshipId || app.id,
      companyId: app.companyId || app.companyName || "",
      advisorId: app.advisorName || "",
    });
    setLogbookRecord(record);
    setInternDetailTab("logbook");
    setSelectedIntern(app);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Academic Assignments</h2>
           <p className="text-gray-500 text-sm font-medium">Assign one academic advisor and two internal examiners per intern in {coordinatorDept}</p>
        </div>
        <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      {activeInterns.length === 0 ? (
        <div className="bg-white border-2 border-dashed rounded-2xl p-20 text-center shadow-sm">
          <GraduationCap className="w-20 h-20 text-gray-100 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Queue is Empty</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Students will appear here once their coordinator approval is finalized.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {activeInterns.map(app => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
               <div className="flex flex-col xl:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                     <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                           <User className="w-8 h-8" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 leading-tight">{app.studentName}</h3>
                           <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Reg ID: {app.studentId}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Affiliated Host</p>
                           <p className="text-sm font-bold text-gray-700">{app.companyName}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                           <p className="text-[10px] font-black text-green-600 uppercase mb-1">Status</p>
                           <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></div>
                              Active Placement
                           </div>
                        </div>
                     </div>
                     <button
                       type="button"
                       onClick={() => openInternDetail(app)}
                       className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl border border-blue-200 transition-colors w-fit"
                     >
                       <Eye className="w-4 h-4" />
                       View Progress
                     </button>
                  </div>

                  <div className="flex-[2] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#fcfcfc] p-8 rounded-3xl border border-gray-100">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-blue-600" />
                           Academic Advisor
                        </label>
                        {app.advisorName ? (
                          <div className="relative group/slot">
                             <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-blue-500 shadow-md">
                                <span className="text-sm font-black text-blue-700">{app.advisorName}</span>
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                             </div>
                             <button 
                               onClick={() => clearAssignment(app.id, "advisorName")}
                               className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                          </div>
                        ) : (
                          <select 
                            onChange={(e) => handleUpdateAssignment(app.id, "advisorName", e.target.value)}
                            className="w-full text-sm font-extrabold bg-white border-2 border-gray-200 rounded-2xl p-4 focus:border-blue-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer hover:border-gray-300"
                            defaultValue=""
                          >
                             <option value="" disabled>Select from Assigned Advisors...</option>
                             {advisorsPool.filter((s) => s.name !== app.examinerName && s.name !== app.examiner2Name).map(s => (
                               <option key={s.id} value={s.name}>{s.name}</option>
                             ))}
                          </select>
                        )}
                     </div>

                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-purple-600" />
                           Internal Examiner 1
                        </label>
                        {app.examinerName ? (
                          <div className="relative group/slot">
                             <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-purple-500 shadow-md">
                                <span className="text-sm font-black text-purple-700">{app.examinerName}</span>
                                <CheckCircle className="w-5 h-5 text-purple-500" />
                             </div>
                             <button 
                               onClick={() => clearAssignment(app.id, "examinerName")}
                               className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                          </div>
                        ) : (
                          <select 
                            onChange={(e) => handleUpdateAssignment(app.id, "examinerName", e.target.value)}
                            className="w-full text-sm font-extrabold bg-white border-2 border-gray-200 rounded-2xl p-4 focus:border-purple-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer hover:border-gray-300"
                            defaultValue=""
                          >
                             <option value="" disabled>
                               {examinersPool.length > 0
                                 ? "Select examiner 1..."
                                 : "No examiners pool — pick from advisors..."}
                             </option>
                             {(examinersPool.length > 0 ? examinersPool : advisorsPool).filter((s) => s.name !== app.advisorName && s.name !== app.examiner2Name).map(s => (
                               <option key={s.id} value={s.name}>{s.name}</option>
                             ))}
                          </select>
                        )}
                     </div>

                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-indigo-600" />
                           Internal Examiner 2
                        </label>
                        {app.examiner2Name ? (
                          <div className="relative group/slot">
                             <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-indigo-500 shadow-md">
                                <span className="text-sm font-black text-indigo-700">{app.examiner2Name}</span>
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                             </div>
                             <button 
                               onClick={() => clearAssignment(app.id, "examiner2Name")}
                               className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                          </div>
                        ) : (
                          <select 
                            onChange={(e) => handleUpdateAssignment(app.id, "examiner2Name", e.target.value)}
                            className="w-full text-sm font-extrabold bg-white border-2 border-gray-200 rounded-2xl p-4 focus:border-indigo-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer hover:border-gray-300"
                            defaultValue=""
                          >
                             <option value="" disabled>
                               {examinersPool.length > 0
                                 ? "Select examiner 2..."
                                 : "No examiners pool — pick from advisors..."}
                             </option>
                             {(examinersPool.length > 0 ? examinersPool : advisorsPool).filter((s) => s.name !== app.advisorName && s.name !== app.examinerName).map(s => (
                               <option key={s.id} value={s.name}>{s.name}</option>
                             ))}
                          </select>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student progress modal (read-only) ── */}
      {selectedIntern && (
        <div className="fixed inset-0 bg-black/60 z-[200] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedIntern.studentName}</h3>
                <p className="text-sm text-gray-500">
                  {selectedIntern.internshipTitle || "Internship"} · {selectedIntern.companyName}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {selectedIntern.advisorName && <span>Advisor: <strong>{selectedIntern.advisorName}</strong></span>}
                  {selectedIntern.examinerName && <span>Examiner 1: <strong>{selectedIntern.examinerName}</strong></span>}
                  {selectedIntern.examiner2Name && <span>Examiner 2: <strong>{selectedIntern.examiner2Name}</strong></span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedIntern(null); setLogbookRecord(null); }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Inner tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setInternDetailTab("logbook")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${internDetailTab === "logbook" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <BookOpen className="w-4 h-4" /> Weekly Logbook
              </button>
              <button
                type="button"
                onClick={() => setInternDetailTab("monthly")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${internDetailTab === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <ClipboardList className="w-4 h-4" /> Monthly Evaluation
              </button>
            </div>

            {/* Weekly Logbook tab */}
            {internDetailTab === "logbook" && logbookRecord && (
              <div>
                {logbookRecord.weeks.filter(w => w.status !== WEEK_STATUS.NOT_SUBMITTED).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No logbook weeks submitted yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logbookRecord.weeks
                      .filter(w => w.status !== WEEK_STATUS.NOT_SUBMITTED)
                      .map(week => {
                        let badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                        if (week.status === WEEK_STATUS.APPROVED) badgeClass = "bg-green-100 text-green-800 border-green-200";
                        if (week.status === WEEK_STATUS.REJECTED_ADVISOR || week.status === WEEK_STATUS.REJECTED_COMPANY) badgeClass = "bg-red-100 text-red-800 border-red-200";
                        if (week.status === WEEK_STATUS.PENDING_COMPANY) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                        return (
                          <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/30">
                            <div className="flex justify-between items-center gap-2">
                              <p className="font-black text-gray-900">Week {week.weekNumber}</p>
                              <span className={`px-2.5 py-1 rounded-full border text-xs font-black uppercase ${badgeClass}`}>
                                {STATUS_LABELS[week.status]}
                              </span>
                            </div>
                            <InternshipLogbookForm
                              role="viewer"
                              readOnly
                              title={`Week ${week.weekNumber}`}
                              initialData={{
                                studentName: logbookRecord.meta?.studentName || selectedIntern.studentName || "",
                                companyName: logbookRecord.meta?.companyName || selectedIntern.companyName || "",
                                supervisorName: logbookRecord.meta?.supervisorName || "",
                                safetyBrief: logbookRecord.meta?.safetyBrief || "",
                                weeks: [week],
                              }}
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Monthly Evaluation tab */}
            {internDetailTab === "monthly" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map(month => {
                  const rec = getEvaluation(selectedIntern.studentId, month);
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
                                <p className="text-xl font-black text-gray-900">{rec.evaluationData.totalMarks}<span className="text-xs font-normal text-gray-400">/100</span></p>
                              </div>
                              <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3 text-center">
                                <p className="text-xs text-gray-400 font-medium mb-1">Performance</p>
                                <p className="text-xl font-black text-green-700">{rec.evaluationData.monthlyPerformance}<span className="text-xs font-normal text-gray-400">/20</span></p>
                              </div>
                            </div>
                          )}
                          <InternshipMonthlyEvaluation
                            key={`coord-${selectedIntern.studentId}-m${month}`}
                            initialData={rec?.evaluationData || {}}
                            readOnly
                            advisorComment={rec?.advisorComment || ""}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
              <button className="bg-green-600 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-green-700 transition" onClick={() => setView("internships")}>
                Internship Students
              </button>
              <button className="bg-blue-800 font-medium text-white px-4 py-2 rounded shadow-sm hover:bg-blue-900 transition" onClick={() => setView("active-students")}>
                Active Internship Students
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

          {/* INTERNSHIP STUDENTS */}
          {view === "internships" && (
            <InternshipStudentsView coordinatorDept={coordinatorDept} onBack={() => setView("home")} />
          )}

          {/* ACTIVE INTERNSHIP STUDENTS (Academic Assignment) */}
          {view === "active-students" && (
            <ActiveInternsManagementView coordinatorDept={coordinatorDept} onBack={() => setView("home")} />
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
