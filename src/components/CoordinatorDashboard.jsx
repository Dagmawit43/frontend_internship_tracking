import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, ChevronDown, CheckCircle, XCircle, User, Building2, Briefcase, GraduationCap, MapPin, FileText, Eye, BookOpen, ClipboardList, Users, UserCheck, Upload, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import CoordinatorSidebar from "./CoordinatorSidebar";
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
import {
  computeOverallEvaluation,
  getOverallApprovals,
  approveOverallAsCoordinator,
} from "../utils/overallEvaluation";

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
  } catch {
    return {};
  }
};

/** Coordinator session: prefer dedicated key (always treated as coordinator). Other keys must have role Coordinator. */
const readCoordinatorProfile = () => {
  try {
    const rawCoord = localStorage.getItem("coordinator");
    if (rawCoord && rawCoord !== "null" && rawCoord !== "undefined") {
      const p = JSON.parse(rawCoord);
      if (p && typeof p === "object" && (p.fullName || p.name || p.username || p.email || p.department)) {
        return p;
      }
    }
    for (const key of ["activeStaffUser", "user"]) {
      const raw = localStorage.getItem(key);
      if (!raw || raw === "null" || raw === "undefined") continue;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") continue;
      if (String(p.role || "").toLowerCase() !== "coordinator") continue;
      if (p.fullName || p.name || p.username || p.email || p.department) return p;
    }
  } catch { /* ignore */ }
  return null;
};

export const getCoordinatorDepartment = () => {
  const coord = readCoordinatorProfile();
  const d = coord?.department;
  if (d != null && String(d).trim() !== "") return String(d).trim();
  return "";
};

export const getCoordinatorName = () => {
  const coord = readCoordinatorProfile();
  if (coord) {
    return coord.fullName || coord.name || coord.username || coord.email || "Coordinator";
  }
  const session = getValidSession();
  return session.fullName || session.name || session.username || session.email || "Coordinator";
};

// ─── Student Management Sub-view ───────────────────────────────────────────
const StudentManagementView = ({ coordinatorDept, onBack }) => {
  const [activeStudents, setActiveStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [resolvedDeptForDisplay, setResolvedDeptForDisplay] = useState("");

  const reloadLists = useCallback(() => {
    const liveDept = (getCoordinatorDepartment() || coordinatorDept || "").trim();
    const allEligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
    const allRegistered = JSON.parse(localStorage.getItem("students") || "[]");
    const normalize = (s) => String(s || "").trim().toLowerCase();

    const useDeptFilter = liveDept.length > 0;
    const deptEligible = useDeptFilter
      ? allEligible.filter((s) => normalize(s.department) === normalize(liveDept))
      : allEligible;
    const deptRegistered = useDeptFilter
      ? allRegistered.filter((s) => normalize(s.department) === normalize(liveDept))
      : allRegistered;

    const registeredKeys = new Set();
    deptRegistered.forEach((r) => {
      if (normalize(r.studentId)) registeredKeys.add(`id:${normalize(r.studentId)}`);
      if (normalize(r.id)) registeredKeys.add(`id:${normalize(r.id)}`);
      if (normalize(r.email)) registeredKeys.add(`em:${normalize(r.email)}`);
    });

    const pending = deptEligible.filter((s) => {
      const sid = normalize(s.studentId);
      const em = normalize(s.email);
      const byId = sid && registeredKeys.has(`id:${sid}`);
      const byEmail = em && registeredKeys.has(`em:${em}`);
      return !byId && !byEmail;
    });

    setActiveStudents(deptRegistered);
    setPendingStudents(pending);
    setResolvedDeptForDisplay(liveDept);
  }, [coordinatorDept]);

  useEffect(() => {
    reloadLists();
    const onStorage = (e) => {
      if (e.key === "eligibleStudents" || e.key === "students" || e.key === "coordinator" || e.key === "user") {
        reloadLists();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("eligibleStudentsUpdated", reloadLists);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("eligibleStudentsUpdated", reloadLists);
    };
  }, [reloadLists]);

  const displayDept =
    resolvedDeptForDisplay && resolvedDeptForDisplay.length > 0
      ? resolvedDeptForDisplay
      : "all departments (set your coordinator department to filter)";

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-green-50/60 px-4 py-3">
            <h3 className="font-semibold text-green-900">Active (Signed Up)</h3>
            <span className="rounded-full bg-green-200/90 px-2.5 py-0.5 text-xs font-bold text-green-900">{activeStudents.length}</span>
          </div>
          {activeStudents.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500">No students are actively registered yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeStudents.map((s) => (
                <li
                  key={s.studentId || s.email}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{s.fullName}</div>
                    <div className="truncate text-xs text-slate-500">{s.studentId} · {s.email}</div>
                  </div>
                  <span className="shrink-0 self-start rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 sm:self-center">Active</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50/60 px-4 py-3">
            <h3 className="font-semibold text-amber-900">Eligible (Not Signed Up)</h3>
            <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-xs font-bold text-amber-900">{pendingStudents.length}</span>
          </div>
          {pendingStudents.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500">All eligible students have registered.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingStudents.map((s) => (
                <li
                  key={s.studentId || s.email}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{s.fullName}</div>
                    <div className="truncate text-xs text-slate-500">{s.studentId} · {s.email}</div>
                  </div>
                  <span className="shrink-0 self-start rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 sm:self-center">Pending</span>
                </li>
              ))}
            </ul>
          )}
        </section>
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
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-slate-500">Everything is caught up.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {pendingApps.map((app) => (
              <li
                key={app.id}
                className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between hover:bg-slate-50/70"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <User className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{app.studentName}</p>
                    <p className="text-xs text-slate-500">ID {app.studentId}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{app.companyName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{app.internshipTitle}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(app, "APPROVE")}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-6 py-14 text-center">
          <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-900">No active interns yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Students appear here after coordinator approval is finalized.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {activeInterns.map((app) => (
              <li key={app.id} className="px-4 py-5 sm:px-6 sm:py-6 hover:bg-slate-50/50">
                <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold leading-tight text-slate-900">{app.studentName}</h3>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">ID {app.studentId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Host</p>
                        <p className="text-sm font-medium text-slate-800">{app.companyName}</p>
                      </div>
                      <div className="rounded-md border border-green-200/80 bg-green-50/50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">Status</p>
                        <p className="flex items-center gap-2 text-sm font-medium text-green-800">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                          Active placement
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openInternDetail(app)}
                      className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4" />
                      View progress
                    </button>

                    {(() => {
                      const overall = computeOverallEvaluation(app);
                      const approvals = getOverallApprovals(app.studentId);
                      const readyForCoordinator =
                        overall.complete &&
                        approvals.advisorApproved &&
                        approvals.examiner1Approved &&
                        approvals.examiner2Approved;
                      return (
                        <div className="rounded-md border border-slate-200 bg-slate-50/40 px-3 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Overall evaluation</p>
                              <p className="text-base font-bold text-green-700">{overall.overallMark100} / 100</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Company: {overall.companyTotal40 != null ? `${overall.companyTotal40} / 40` : "—"}
                                {" · "}
                                Academic: {overall.academicOverall100} / 100
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase">
                              <span className={`rounded border px-2 py-0.5 ${approvals.advisorApproved ? "border-green-200 bg-green-100 text-green-800" : "border-slate-200 bg-white text-slate-600"}`}>
                                Advisor
                              </span>
                              <span className={`rounded border px-2 py-0.5 ${approvals.examiner1Approved ? "border-green-200 bg-green-100 text-green-800" : "border-slate-200 bg-white text-slate-600"}`}>
                                Ex1
                              </span>
                              <span className={`rounded border px-2 py-0.5 ${approvals.examiner2Approved ? "border-green-200 bg-green-100 text-green-800" : "border-slate-200 bg-white text-slate-600"}`}>
                                Ex2
                              </span>
                              <span className={`rounded border px-2 py-0.5 ${approvals.coordinatorApproved ? "border-green-200 bg-green-100 text-green-800" : "border-slate-200 bg-white text-slate-600"}`}>
                                Coord
                              </span>
                            </div>
                          </div>

                          {!approvals.coordinatorApproved ? (
                            <button
                              type="button"
                              disabled={!readyForCoordinator}
                              onClick={() => approveOverallAsCoordinator(app.studentId)}
                              className="mt-3 w-full rounded-md bg-blue-600 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              Approve overall evaluation
                            </button>
                          ) : (
                            <div className="mt-3 rounded-md border border-green-200 bg-green-50 py-2 text-center text-xs font-semibold uppercase tracking-wide text-green-800">
                              Overall evaluation approved
                            </div>
                          )}
                          {!readyForCoordinator && !approvals.coordinatorApproved && (
                            <p className="mt-2 text-xs text-slate-500">
                              Waiting for advisor + examiner 1 + examiner 2 approvals (and all evaluations submitted).
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-3 xl:max-w-[58%] xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                        Academic advisor
                      </label>
                      {app.advisorName ? (
                        <div className="group/slot relative">
                          <div className="flex items-center justify-between rounded-md border border-blue-300 bg-white px-3 py-2.5">
                            <span className="text-sm font-medium text-blue-900">{app.advisorName}</span>
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </div>
                          <button
                            type="button"
                            onClick={() => clearAssignment(app.id, "advisorName")}
                            className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow transition-opacity group-hover/slot:opacity-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleUpdateAssignment(app.id, "advisorName", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select advisor…
                          </option>
                          {advisorsPool.filter((s) => s.name !== app.examinerName && s.name !== app.examiner2Name).map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5 text-purple-600" />
                        Internal examiner 1
                      </label>
                      {app.examinerName ? (
                        <div className="group/slot relative">
                          <div className="flex items-center justify-between rounded-md border border-purple-300 bg-white px-3 py-2.5">
                            <span className="text-sm font-medium text-purple-900">{app.examinerName}</span>
                            <CheckCircle className="h-4 w-4 text-purple-500" />
                          </div>
                          <button
                            type="button"
                            onClick={() => clearAssignment(app.id, "examinerName")}
                            className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow transition-opacity group-hover/slot:opacity-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleUpdateAssignment(app.id, "examinerName", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-purple-500"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {examinersPool.length > 0 ? "Select examiner 1…" : "No examiners — pick from advisors…"}
                          </option>
                          {(examinersPool.length > 0 ? examinersPool : advisorsPool).filter((s) => s.name !== app.advisorName && s.name !== app.examiner2Name).map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                        Internal examiner 2
                      </label>
                      {app.examiner2Name ? (
                        <div className="group/slot relative">
                          <div className="flex items-center justify-between rounded-md border border-indigo-300 bg-white px-3 py-2.5">
                            <span className="text-sm font-medium text-indigo-900">{app.examiner2Name}</span>
                            <CheckCircle className="h-4 w-4 text-indigo-500" />
                          </div>
                          <button
                            type="button"
                            onClick={() => clearAssignment(app.id, "examiner2Name")}
                            className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow transition-opacity group-hover/slot:opacity-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleUpdateAssignment(app.id, "examiner2Name", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {examinersPool.length > 0 ? "Select examiner 2…" : "No examiners — pick from advisors…"}
                          </option>
                          {(examinersPool.length > 0 ? examinersPool : advisorsPool).filter((s) => s.name !== app.advisorName && s.name !== app.examinerName).map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
                <ClipboardList className="w-4 h-4" /> Company Monthly Evaluation
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

            {/* Company Monthly Evaluation tab */}
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
                            existingAdvisorComment={rec?.advisorComment || ""}
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

const COORDINATOR_HOME_TILES = [
  { view: "staff", title: "Staff list", description: "View unassigned staff and invite advisors or examiners.", icon: Users, accent: "bg-blue-50 text-blue-600 ring-blue-100" },
  { view: "advisors", title: "Assigned advisors", description: "See advisors linked to your department.", icon: UserCheck, accent: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  { view: "examiners", title: "Assigned examiners", description: "See internal examiners for your department.", icon: GraduationCap, accent: "bg-violet-50 text-violet-700 ring-violet-100" },
  { view: "internships", title: "Internship approvals", description: "Review and approve student placement choices.", icon: Briefcase, accent: "bg-amber-50 text-amber-800 ring-amber-100" },
  { view: "active-students", title: "Active interns", description: "Assign advisors and examiners to active placements.", icon: ClipboardList, accent: "bg-sky-50 text-sky-700 ring-sky-100" },
  { view: "students", title: "Manage students", description: "Registered vs eligible students in your department.", icon: BookOpen, accent: "bg-orange-50 text-orange-800 ring-orange-100" },
  { view: "upload", title: "Upload eligible list", description: "Import eligible students from a JSON file.", icon: Upload, accent: "bg-indigo-50 text-indigo-700 ring-indigo-100" },
];

/** Counts for coordinator home tiles (matches department filtering used in sub-views). */
function computeCoordinatorHomeMetrics(coordinatorDept, mockStaffCount, advisorCount, examinerCount) {
  const normalize = (s) => String(s || "").trim().toLowerCase();
  const liveDept = String(getCoordinatorDepartment() || coordinatorDept || "").trim();
  const useDeptFilter = liveDept.length > 0;
  const deptNorm = normalize(liveDept);

  let students = [];
  let eligible = [];
  let applications = [];
  try {
    students = JSON.parse(localStorage.getItem("students") || "[]");
    eligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
    applications = JSON.parse(localStorage.getItem("applications") || "[]");
  } catch {
    /* ignore */
  }

  const deptStudents = useDeptFilter
    ? students.filter((s) => normalize(s.department) === deptNorm)
    : students;
  const deptEligible = useDeptFilter
    ? eligible.filter((s) => normalize(s.department) === deptNorm)
    : eligible;

  const registeredKeys = new Set();
  deptStudents.forEach((r) => {
    if (normalize(r.studentId)) registeredKeys.add(`id:${normalize(r.studentId)}`);
    if (normalize(r.id)) registeredKeys.add(`id:${normalize(r.id)}`);
    if (normalize(r.email)) registeredKeys.add(`em:${normalize(r.email)}`);
  });
  const notSignedUp = deptEligible.filter((s) => {
    const sid = normalize(s.studentId);
    const em = normalize(s.email);
    const byId = sid && registeredKeys.has(`id:${sid}`);
    const byEmail = em && registeredKeys.has(`em:${em}`);
    return !byId && !byEmail;
  }).length;

  let pendingApprovals = 0;
  let activeInterns = 0;
  applications.forEach((app) => {
    const student = students.find((s) => s.studentId === app.studentId || s.name === app.studentName);
    if (!student) return;
    if (useDeptFilter && normalize(student.department) !== deptNorm) return;
    if (app.coordinatorApprovalStatus === "PENDING") pendingApprovals += 1;
    if (app.finalInternshipStatus === "ACTIVE_INTERN") activeInterns += 1;
  });

  return {
    staffUnassigned: mockStaffCount,
    advisorsAssigned: advisorCount,
    examinersAssigned: examinerCount,
    pendingApprovals,
    activeInterns,
    registeredStudents: deptStudents.length,
    notSignedUp,
    eligibleOnFile: deptEligible.length,
    eligibleTotalAllDepts: eligible.length,
  };
}

function homeTileMetric(view, m) {
  switch (view) {
    case "staff":
      return { primary: m.staffUnassigned, hint: "unassigned in pool" };
    case "advisors":
      return { primary: m.advisorsAssigned, hint: "assigned to department" };
    case "examiners":
      return { primary: m.examinersAssigned, hint: "assigned to department" };
    case "internships":
      return { primary: m.pendingApprovals, hint: "awaiting your approval" };
    case "active-students":
      return { primary: m.activeInterns, hint: "active placements" };
    case "students":
      return {
        primary: m.registeredStudents,
        hint:
          m.eligibleOnFile > 0
            ? `${m.eligibleOnFile} eligible · ${m.notSignedUp} not signed up`
            : "Upload a list to compare eligible vs registered",
      };
    case "upload":
      return { primary: m.eligibleTotalAllDepts, hint: "rows in stored JSON" };
    default:
      return { primary: "—", hint: "" };
  }
}

const CoordinatorDashboard = () => {
  const [coordinatorDept, setCoordinatorDept] = useState(() => getCoordinatorDepartment());
  const [coordinatorName, setCoordinatorName] = useState(() => getCoordinatorName());
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
  const [homeMetricsNonce, setHomeMetricsNonce] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setCoordinatorDept(getCoordinatorDepartment());
    setCoordinatorName(getCoordinatorName());
  }, [view]);

  useEffect(() => {
    if (view !== "home") return undefined;
    const bump = () => setHomeMetricsNonce((n) => n + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("eligibleStudentsUpdated", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("eligibleStudentsUpdated", bump);
    };
  }, [view]);

  const homeMetrics = useMemo(
    () =>
      computeCoordinatorHomeMetrics(
        coordinatorDept,
        mockStaff.length,
        assignedAdvisors.length,
        assignedExaminers.length
      ),
    [
      coordinatorDept,
      mockStaff.length,
      assignedAdvisors.length,
      assignedExaminers.length,
      view,
      homeMetricsNonce,
    ]
  );

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
        window.dispatchEvent(new CustomEvent("eligibleStudentsUpdated"));
        setFileSuccess("Eligible students uploaded successfully");
        setSelectedFile(null);
      } catch { setFileError("Invalid student file format"); }
    };
    reader.onerror = () => setFileError("Failed to read file.");
    reader.readAsText(selectedFile);
  };

  // Populate mockStaff on mount, subtract already-assigned ones (dept-scoped)
  useEffect(() => {
    const deptRaw = (getCoordinatorDepartment() || coordinatorDept || "").trim();
    const dept = deptRaw.length > 0 ? deptRaw : "Department";
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
  }, [coordinatorDept]);

  const navigateCoordinator = (next) => {
    if (next === "upload") {
      setFileError("");
      setFileSuccess("");
      setSelectedFile(null);
    }
    setView(next);
    if (next === "home") {
      setHomeMetricsNonce((n) => n + 1);
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col md:flex-row">
      <CoordinatorSidebar
        currentView={view}
        coordinatorName={coordinatorName}
        onNavigate={navigateCoordinator}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <nav className="app-nav">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 md:hidden">
              <img src={logoSrc} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200/80" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900">Internship Tracking</h1>
                <p className="text-xs text-slate-500">AASTU</p>
              </div>
            </div>
            <div className="hidden flex-1 md:block" aria-hidden="true" />
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 sm:inline-flex"
              >
                Logout
              </button>
              <div className="flex items-center gap-2 rounded-lg px-2 py-2 sm:px-3">
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:block">{coordinatorName}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              </div>
            </div>
          </div>
        </nav>

        {toast.show && (
          <div className="fixed right-4 top-20 z-[100] animate-bounce-in">
            <div className="flex items-center gap-3 rounded-lg border-2 border-green-400 bg-green-600 px-6 py-3 text-white shadow-2xl">
              <div className="rounded-full bg-white/20 p-1">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-bold tracking-tight">{toast.message}</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {view === "home" && (
            <>
              <div className="app-hero mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="mb-1 text-2xl font-bold md:text-3xl">Welcome, {coordinatorName}</h1>
                    <div className="flex flex-wrap gap-4 text-sm opacity-90 md:text-base">
                      <span>
                        Department: <strong>{coordinatorDept || "—"}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium opacity-80">Role</p>
                      <p className="text-sm font-bold">Coordinator</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-5 sm:grid-cols-4">
                  {[
                    { label: "Pending approvals", value: homeMetrics.pendingApprovals },
                    { label: "Active interns", value: homeMetrics.activeInterns },
                    { label: "Not signed up", value: homeMetrics.notSignedUp },
                    { label: "Staff in pool", value: homeMetrics.staffUnassigned },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-white/10 px-3 py-2.5 backdrop-blur-sm"
                    >
                      <p className="text-2xl font-bold tabular-nums leading-tight">{stat.value}</p>
                      <p className="mt-0.5 text-xs font-medium opacity-90">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {COORDINATOR_HOME_TILES.map((tile) => {
                  const Icon = tile.icon;
                  const { primary, hint } = homeTileMetric(tile.view, homeMetrics);
                  return (
                    <button
                      key={tile.view}
                      type="button"
                      onClick={() => navigateCoordinator(tile.view)}
                      className="app-card group flex w-full flex-col gap-3 p-5 text-left transition-all hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tile.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{tile.title}</p>
                            <span className="shrink-0 text-xl font-bold tabular-nums text-indigo-600">{primary}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
                          {hint ? (
                            <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>
                          ) : null}
                        </div>
                        <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view !== "home" && (
            <div className="max-w-6xl">

          {/* STUDENTS */}
          {view === "students" && (
            <StudentManagementView coordinatorDept={coordinatorDept} onBack={() => navigateCoordinator("home")} />
          )}

          {/* INTERNSHIP STUDENTS */}
          {view === "internships" && (
            <InternshipStudentsView coordinatorDept={coordinatorDept} onBack={() => navigateCoordinator("home")} />
          )}

          {/* ACTIVE INTERNSHIP STUDENTS (Academic Assignment) */}
          {view === "active-students" && (
            <ActiveInternsManagementView coordinatorDept={coordinatorDept} onBack={() => navigateCoordinator("home")} />
          )}

          {/* UPLOAD */}
          {view === "upload" && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Eligible Students</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
              </div>
              {fileError && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">{fileError}</div>}
              {fileSuccess && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md text-sm">{fileSuccess}</div>}
              <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">Select JSON File</label>
                <input
                  type="file" accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                <button type="button" onClick={handleFileUpload} className="mt-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700">
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
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
              </div>
              {mockStaff.length === 0
                ? <p className="text-slate-500 py-4">No unassigned staff available.</p>
                : (
                  <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {mockStaff.map((s) => (
                      <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-sm text-slate-600">{s.email}</div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button type="button" onClick={() => assignAsAdvisor(s)} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                            Assign advisor
                          </button>
                          <button type="button" onClick={() => assignAsExaminer(s)} className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100">
                            Assign examiner
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {/* ASSIGNED ADVISORS */}
          {view === "advisors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assigned Advisors</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
              </div>
              {assignedAdvisors.length === 0
                ? <p className="text-slate-500 py-4">No advisors have been assigned yet.</p>
                : (
                  <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {assignedAdvisors.map((s) => (
                      <li key={s.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-sm text-slate-600">{s.email}</div>
                        </div>
                        <span className="shrink-0 self-start rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 sm:self-center">{s.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {/* ASSIGNED EXAMINERS */}
          {view === "examiners" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assigned Examiners</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
              </div>
              {assignedExaminers.length === 0
                ? <p className="text-slate-500 py-4">No examiners have been assigned yet.</p>
                : (
                  <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {assignedExaminers.map((s) => (
                      <li key={s.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-sm text-slate-600">{s.email}</div>
                        </div>
                        <span className="shrink-0 self-start rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-900 sm:self-center">{s.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

        </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
