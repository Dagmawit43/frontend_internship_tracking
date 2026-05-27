import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, ChevronDown, CheckCircle, XCircle, User, Building2, Briefcase, GraduationCap, MapPin, FileText, Eye, BookOpen, ClipboardList, Users, UserCheck, Upload, ChevronRight, LogOut, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import CoordinatorSidebar from "./CoordinatorSidebar";
import storageService from "../services/storageService";
import internshipService from "../services/internshipService";
import userService from "../services/userService";
import logbookService from "../services/logbookService";
import evaluationService from "../services/evaluationService";
import InternshipAcceptanceForm from "./InternshipAcceptanceForm";
import InternshipLogbookForm from "./InternshipLogbookForm";
import InternshipMonthlyEvaluation from "./InternshipMonthlyEvaluation";
import InternshipEvaluationForm from "./InternshipEvaluationForm";
import AdvisorStudentEvaluationForm from "./AdvisorStudentEvaluationForm";
import ExaminerUniversityEvaluationForm from "./ExaminerUniversityEvaluationForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  getLogbookForApplication,
} from "../utils/weeklyLogbook";
import {
  EVAL_STATUS,
  EVAL_STATUS_LABELS,
  getEvaluation,
} from "../utils/monthlyEvaluations";
import {
  FINAL_EVAL_STATUS,
  FINAL_EVAL_STATUS_LABELS,
  getFinalEvaluation,
} from "../utils/finalEvaluations";
import {
  getAdvisorEvaluation,
  ADVISOR_EVAL_STATUS,
} from "../utils/advisorEvaluations";
import { getExaminerEvaluationForAdvisorSlot } from "../utils/examinerEvaluations";
import {
  getDocumentsByStudentId,
  getStudentDocumentSummary,
  ROLE_DOC_STATUS,
  syncInternshipDocumentsFromApi,
} from "../utils/internshipDocuments";
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

  const reloadLists = useCallback(async () => {
    const liveDept = (getCoordinatorDepartment() || coordinatorDept || "").trim();
    const normalize = (s) => String(s || "").trim().toLowerCase();

    // Prefer backend eligible students; fall back to localStorage cache if needed.
    let allEligible = [];
    try {
      const eligibleRes = await userService.getEligibleStudents(liveDept ? { department: liveDept } : {});
      if (eligibleRes && eligibleRes.success) {
        allEligible = Array.isArray(eligibleRes.data)
          ? eligibleRes.data
          : (eligibleRes.data?.results || eligibleRes.data?.students || eligibleRes.data || []);
      } else {
        allEligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
      }
    } catch {
      allEligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
    }

    // Prefer API for registered students; fall back to localStorage
    let allRegistered = [];
    try {
      // lazy-load dataService to avoid cyclic imports at top-level
      const dataService = await import("../services/dataService");
      const res = await dataService.default.getStudents();
      if (res && res.success && Array.isArray(res.data)) {
        allRegistered = res.data;
      } else {
        allRegistered = JSON.parse(localStorage.getItem("students") || "[]");
      }
    } catch (err) {
      allRegistered = JSON.parse(localStorage.getItem("students") || "[]");
    }

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
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={onBack}>
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

  const normalizeApp = useCallback((app) => {
    const studentSnapshot = app?.form_snapshot?.student || {};
    const companySnapshot = app?.form_snapshot?.company || {};
    const internshipSnapshot = app?.form_snapshot?.internship || {};

    return {
      id: app.id,
      studentName: app.student_name || studentSnapshot.name || "Unknown student",
      studentId: studentSnapshot.student_id || `#${app.id}`,
      studentEmail: app.student_email || studentSnapshot.email || "",
      studentFull: {
        department: studentSnapshot.department || coordinatorDept || "N/A",
        email: app.student_email || studentSnapshot.email || "",
      },
      internshipTitle: app.position_title || internshipSnapshot.position_title || "Internship Application",
      internshipFull: {
        description: app.position_description || internshipSnapshot.description || "No description available.",
        start_date: internshipSnapshot.requested_start_date || app.requested_start_date || "",
        end_date: internshipSnapshot.requested_end_date || app.requested_end_date || "",
        total_hours: app.working_hours_per_day || internshipSnapshot.working_hours_per_day || "",
        days_in_week: app.working_days_per_week || internshipSnapshot.working_days_per_week || "",
      },
      companyName: app.company_name || companySnapshot.name || "Unknown company",
      companyFull: {
        location: companySnapshot.physical_address || companySnapshot.mailing_address || "Location not specified",
        description: companySnapshot.name || app.company_name || "",
      },
      reason: app.form_snapshot?.student?.statement || app.reason_for_joining || "No statement provided.",
      additionalDocument: app.resume_url || app.form_snapshot?.student?.resume_url || "",
      documentName: app.form_snapshot?.student?.resume_url ? "CV / Resume" : "CV / Resume",
      acceptanceForm: app.form_snapshot || null,
      raw: app,
    };
  }, [coordinatorDept]);

  useEffect(() => {
    let mounted = true;

    const loadApps = async () => {
      const result = await internshipService.getApplications();
      if (!mounted) return;

      const payload = result.success ? result.data : [];
      const items = Array.isArray(payload) ? payload : payload?.results || [];
      setPendingApps(items.map(normalizeApp));
    };

    loadApps();
    return () => {
      mounted = false;
    };
  }, [normalizeApp]);

  const reloadApps = useCallback(async () => {
    const result = await internshipService.getApplications();
    const payload = result.success ? result.data : [];
    const items = Array.isArray(payload) ? payload : payload?.results || [];
    setPendingApps(items.map(normalizeApp));
  }, [normalizeApp]);

  const handleAction = async (app, action) => {
    if (action === "REJECT" && !window.confirm("Are you sure you want to REJECT this internship placement?")) return;
    
    try {
      const result = await internshipService.coordinatorReviewApplication(
        app.id,
        action === "APPROVE" ? "approve" : "reject",
        getCoordinatorName(),
      );

      if (!result.success) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : result.error?.detail || result.error?.error || "Unable to update application."
        );
      }

      alert(`Application ${action === "APPROVE" ? "Approved" : "Rejected"} successfully.`);
      setSelectedApp(null);
      await reloadApps();
    } catch (err) {
      console.error(err);
      window.alert(err?.message || "Unable to submit coordinator approval.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internship Approvals</h2>
          <p className="text-gray-500">Forensic review of student internship selections for {coordinatorDept}</p>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={onBack}>
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
                      <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-600 w-fit">
                         <User className="w-5 h-5 text-indigo-600" />
                         <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Student Profile</h4>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                         <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Full Name</p>
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
                            <p className="text-sm font-bold text-indigo-600">{selectedApp.studentFull?.email || "N/A"}</p>
                         </div>
                      </div>
                      
                      {selectedApp.additionalDocument && (
                         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="bg-white p-2 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
                               <div>
                                  <p className="text-xs font-bold text-gray-900">CV / Resume Uploaded</p>
                                  <p className="text-[10px] text-gray-500">{selectedApp.documentName || "Student_CV.pdf"}</p>
                               </div>
                            </div>
                            <a 
                              href={selectedApp.additionalDocument} 
                              download={selectedApp.documentName || "CV.pdf"}
                              className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
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
  const [debugLogs, setDebugLogs] = useState([]);
  const [progressDataNonce, setProgressDataNonce] = useState(0);
  const [advisorEvalRecord, setAdvisorEvalRecord] = useState(null);
  const [apiMonthlyEvals, setApiMonthlyEvals] = useState({});   // keyed by internship_id → month → item
  const [apiExaminerEvals, setApiExaminerEvals] = useState([]); // flat list for selected intern
  // Incremented on every clearAssignment so controlled selects remount and accept new selections
  const [selectResetKey, setSelectResetKey] = useState(0);

  const progressTabClass = (tab) =>
    `flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
      internDetailTab === tab
        ? "bg-white text-indigo-600 shadow-sm"
        : "text-gray-500 hover:text-gray-700"
    }`;

  useEffect(() => {
    const loadData = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const students = JSON.parse(localStorage.getItem("students")) || [];
      
      const filtered = allApps.filter((app) => {
        // Treat approved applications and ongoing internships as active interns.
        const status = String(app.finalInternshipStatus || app.__raw?.status || app.__raw?.dept_status || "").toUpperCase();
        const appApproved = String(app.__raw?.dept_status || "").toUpperCase() === "APPROVED";
        const isActive = status === "ACTIVE_INTERN" || status === "ONGOING" || status === "ACCEPTED" || appApproved;

        if (!isActive) return false;

        // If the coordinator has no department configured, do not discard approved records.
        const dept = String(coordinatorDept || "").trim().toLowerCase();
        if (!dept) return true;

        const rawStudentDept = String(app.__raw?.form_snapshot?.student?.department || app.__raw?.department || "").trim().toLowerCase();
        const student = students.find((s) => {
          const sid = String(s.studentId || s.id || "").trim();
          const nameMatch = String(s.name || s.fullName || s.full_name || "").trim() === String(app.studentName || "").trim();
          const idMatch = sid && sid === String(app.studentId || app.student_id || "").trim();
          return nameMatch || idMatch;
        });

        const studentDept = String(student?.department || app.__raw?.form_snapshot?.student?.department || app.__raw?.department || "").trim().toLowerCase();
        return rawStudentDept === dept || studentDept === dept;
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

    // Load data from localStorage immediately so UI is responsive,
    // then fetch coordinator-approved applications from the API.
    loadData();
    (async () => {
      try {
        const approvedRes = await internshipService.getApprovedApplications();
        const items = approvedRes?.success
          ? (Array.isArray(approvedRes.data) ? approvedRes.data : (approvedRes.data?.results || approvedRes.data || []))
          : [];

        if (items.length === 0) {
          // Nothing from API — keep whatever localStorage had
          return;
        }

        // Preserve manually-assigned advisor/examiner fields from localStorage
        const existingLocal = JSON.parse(localStorage.getItem("applications") || "[]");
        const localMap = new Map(existingLocal.map((a) => [a.id, a]));

        const mapped = items.map((app) => {
          const local = localMap.get(app.id) || {};
          return {
            id: app.id,
            studentName: app.student_name || app.form_snapshot?.student?.name || "",
            studentId: app.form_snapshot?.student?.student_id || app.student_id || "",
            studentUserPk: app.student_user_id || null,
            companyName: app.company_name || app.form_snapshot?.company?.name || "",
            positionTitle: app.position_title || app.form_snapshot?.internship?.position_title || "",
            advisorName: app.advisor_name || (app.advisor?.name) || local.advisorName || "",
            examinerName: app.examiner_name || local.examinerName || "",
            examiner2Name: app.examiner2_name || local.examiner2Name || "",
            finalInternshipStatus: "ACTIVE_INTERN",
            __raw: app,
          };
        });

        setActiveInterns(mapped);

        // Persist merged data back to localStorage without overwriting assignment fields
        const mergeMap = new Map(existingLocal.map((a) => [a.id, a]));
        mapped.forEach((m) => {
          const prev = mergeMap.get(m.id) || {};
          mergeMap.set(m.id, {
            ...m,
            advisorName: prev.advisorName || m.advisorName,
            examinerName: prev.examinerName || m.examinerName,
            examiner2Name: prev.examiner2Name || m.examiner2Name,
          });
        });
        localStorage.setItem("applications", JSON.stringify(Array.from(mergeMap.values())));
        // Do NOT dispatch storage event here — it would re-trigger loadData and loop
      } catch (err) {
        console.debug("Failed to fetch approved applications:", err);
      }
    })();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [coordinatorDept]);

  useEffect(() => {
    const loadStaffPools = async () => {
      const selectedDept = String(
        selectedIntern?.studentFull?.department ||
        selectedIntern?.form_snapshot?.student?.department ||
        selectedIntern?.form_snapshot?.student?.department_name ||
        coordinatorDept ||
        ""
      ).trim();
      if (!selectedDept) return;

      try {
        const [advisorsRes, examinersRes] = await Promise.all([
          userService.getAssignedAdvisors({ department: selectedDept }),
          userService.getAssignedExaminers({ department: selectedDept }),
        ]);

        const advisors = advisorsRes?.success
          ? (Array.isArray(advisorsRes.data) ? advisorsRes.data : (advisorsRes.data?.results || advisorsRes.data || []))
          : [];
        const examiners = examinersRes?.success
          ? (Array.isArray(examinersRes.data) ? examinersRes.data : (examinersRes.data?.results || examinersRes.data || []))
          : [];

        setAdvisorsPool(advisors);
        setExaminersPool(examiners);
      } catch (err) {
        console.error("Failed to load staff pools for active intern detail", err);
      }
    };

    if (selectedIntern) {
      loadStaffPools();
    }
  }, [selectedIntern, coordinatorDept]);

  // Ensure approved students exist for this coordinator's department.
  useEffect(() => {
    const ensureApprovedStudents = async () => {
      const dept = (coordinatorDept || "").trim();
      if (!dept) return;
      try {
        // Ask backend for approved students in this department
        const res = await userService.getStudents({ department: dept, status: "approved" });
        const list = res.success ? (Array.isArray(res.data) ? res.data : (res.data.results || res.data || [])) : [];

        if (!list || list.length === 0) {
          // No approved students found - attempt to create from local eligible list
          const eligible = JSON.parse(localStorage.getItem("eligibleStudents") || "[]");
          const deptEligible = eligible.filter((s) => String(s.department || "").trim().toLowerCase() === String(dept).toLowerCase());
          if (deptEligible.length === 0) return;

          const created = [];
          for (const s of deptEligible) {
            try {
              const payload = {
                student_id: s.studentId || s.student_id || s.id || "",
                studentId: s.studentId || s.student_id || s.id || "",
                full_name: s.fullName || s.name || s.full_name || "",
                fullName: s.fullName || s.name || s.full_name || "",
                email: s.email || "",
                department: dept,
              };
              const c = await userService.createStudent(payload);
              if (c.success) created.push(c.data);
            } catch (e) {
              // ignore single failures
            }
          }

          if (created.length > 0) {
            const existing = JSON.parse(localStorage.getItem("students") || "[]");
            const merged = [...existing, ...created];
            localStorage.setItem("students", JSON.stringify(merged));
            window.dispatchEvent(new Event("storage"));
          }
        } else {
          // Persist fetched students locally for UI usage
          const existing = JSON.parse(localStorage.getItem("students") || "[]");
          const map = new Map();
          existing.forEach((s) => {
            const key = (s.studentId || s.id || s.student_id || s.email || "").toString();
            if (key) map.set(key, s);
          });
          list.forEach((s) => {
            const key = (s.studentId || s.id || s.student_id || s.email || "").toString();
            if (key) map.set(key, s);
          });
          const merged = Array.from(map.values());
          localStorage.setItem("students", JSON.stringify(merged));
          window.dispatchEvent(new Event("storage"));
        }
      } catch (err) {
        console.error("ensureApprovedStudents", err);
      }
    };

    ensureApprovedStudents();
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

  // Use API when assigning advisor/examiner to a student
  const handleUpdateAssignmentApi = async (appId, field, name) => {
    if (!name) return;
    try {
      // Find app from activeInterns state (not localStorage — may be stale)
      const app = activeInterns.find((a) => a.id === appId)
        || JSON.parse(localStorage.getItem("applications") || "[]").find((a) => a.id === appId);
      if (!app) throw new Error("Application not found");

      // The endpoint expects the student's User PK
      const apiPk = app.studentUserPk
        || app.student_user_id
        || app.__raw?.student_user_id
        || null;

      if (!apiPk) {
        console.warn("Student User PK not found, falling back to local-only update");
        handleUpdateAssignment(appId, field, name);
        return;
      }

      const pool = advisorsPool.length > 0 ? advisorsPool : JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
      const examPool = examinersPool.length > 0 ? examinersPool : JSON.parse(localStorage.getItem("assignedExaminers") || "[]");

      if (field === "advisorName") {
        const advisorObj = pool.find((p) =>
          (p.name || p.user_name || p.username || p.fullName) === name || p.email === name
        );
        const advisorId = advisorObj ? (advisorObj.user_id || advisorObj.userId || advisorObj.id) : null;

        if (!advisorId) {
          console.warn("Advisor user_id not found for name:", name, "pool:", pool);
          handleUpdateAssignment(appId, field, name);
          return;
        }

        const res = await userService.assignAdvisor(apiPk, advisorId);
        if (!res.success) throw new Error(JSON.stringify(res.error) || "API assign failed");

        handleUpdateAssignment(appId, field, name);
        showToast(`Advisor assigned to ${app.studentName}`);

        // Refresh activeInterns from API to persist the assignment
        try {
          const refreshRes = await internshipService.getApprovedApplications();
          if (refreshRes?.success) {
            const refreshItems = Array.isArray(refreshRes.data) ? refreshRes.data : (refreshRes.data?.results || refreshRes.data || []);
            setActiveInterns((prev) => prev.map((a) => {
              const fresh = refreshItems.find((r) => r.id === a.id);
              if (!fresh) return a;
              return {
                ...a,
                advisorName: fresh.advisor_name || a.advisorName,
                examinerName: fresh.examiner_name || a.examinerName,
                examiner2Name: fresh.examiner2_name || a.examiner2Name,
                studentUserPk: fresh.student_user_id || a.studentUserPk,
              };
            }));
          }
        } catch { /* keep local state */ }
        return;
      }

      if (field === "examinerName" || field === "examiner2Name") {
        const searchPool = examPool.length > 0 ? examPool : pool;
        const examinerObj = searchPool.find((p) =>
          (p.name || p.user_name || p.username || p.fullName) === name || p.email === name
        );
        const examinerId = examinerObj ? (examinerObj.user_id || examinerObj.userId || examinerObj.id) : null;

        if (!examinerId) {
          console.warn("Examiner user_id not found for name:", name, "pool:", searchPool);
          handleUpdateAssignment(appId, field, name);
          return;
        }

        const res = await userService.assignExaminer(apiPk, examinerId);
        if (!res.success) throw new Error(JSON.stringify(res.error) || "API assign failed");

        handleUpdateAssignment(appId, field, name);
        showToast(`Examiner assigned to ${app.studentName}`);

        // Refresh activeInterns from API to persist the assignment
        try {
          const refreshRes = await internshipService.getApprovedApplications();
          if (refreshRes?.success) {
            const refreshItems = Array.isArray(refreshRes.data) ? refreshRes.data : (refreshRes.data?.results || refreshRes.data || []);
            setActiveInterns((prev) => prev.map((a) => {
              const fresh = refreshItems.find((r) => r.id === a.id);
              if (!fresh) return a;
              return {
                ...a,
                advisorName: fresh.advisor_name || a.advisorName,
                examinerName: fresh.examiner_name || a.examinerName,
                examiner2Name: fresh.examiner2_name || a.examiner2Name,
                studentUserPk: fresh.student_user_id || a.studentUserPk,
              };
            }));
          }
        } catch { /* keep local state */ }
        return;
      }

      handleUpdateAssignment(appId, field, name);
    } catch (err) {
      console.error("Failed to assign via API:", err);
      alert(`Failed to assign: ${err.message || err}`);
    }
  };

  const clearAssignment = async (appId, field) => {
    // Optimistically update state and localStorage
    setActiveInterns((prev) => prev.map((a) => a.id === appId ? { ...a, [field]: "" } : a));
    const allApps = JSON.parse(localStorage.getItem("applications")) || [];
    const updatedApps = allApps.map(app => app.id === appId ? { ...app, [field]: "" } : app);
    localStorage.setItem("applications", JSON.stringify(updatedApps));
    setSelectResetKey((k) => k + 1);
    window.dispatchEvent(new Event("storage"));

    // Call the backend to persist the removal
    try {
      const app = activeInterns.find((a) => a.id === appId)
        || allApps.find((a) => a.id === appId);
      if (!app) return;
      const apiPk = app.studentUserPk || app.student_user_id || app.__raw?.student_user_id || null;
      if (!apiPk) return;

      if (field === "advisorName") {
        const res = await userService.removeAdvisor(apiPk);
        if (!res.success) console.warn("Failed to remove advisor via API:", res.error);
      } else if (field === "examinerName" || field === "examiner2Name") {
        // Find the examiner's user_id from the pool so we remove only that specific examiner
        const examinerName = field === "examinerName" ? app.examinerName : app.examiner2Name;
        const searchPool = examinersPool.length > 0 ? examinersPool : advisorsPool;
        const examinerObj = searchPool.find((p) =>
          (p.name || p.user_name || p.username) === examinerName
        );
        const examinerId = examinerObj ? (examinerObj.user_id || examinerObj.userId || examinerObj.id) : null;
        const res = await userService.removeExaminer(apiPk, examinerId);
        if (!res.success) console.warn("Failed to remove examiner via API:", res.error);
      }
    } catch (err) {
      console.error("Failed to remove assignment via API:", err);
    }
  };

  const pushDebug = (msg) => {
    try {
      setDebugLogs((d) => [`${new Date().toISOString()} — ${msg}`, ...d].slice(0, 12));
    } catch {
      // ignore
    }
  };

  const loadStaffPoolsForDepartment = async (department) => {
    const selectedDept = String(department || "").trim();
    if (!selectedDept) return;

    try {
      const assignedRes = await userService.getAssignedStaff({ department: selectedDept });
      const assigned = assignedRes?.success
        ? (Array.isArray(assignedRes.data) ? assignedRes.data : (assignedRes.data?.results || assignedRes.data || []))
        : [];

      const advisors = assigned.filter((item) => String(item.role || "").toUpperCase() === "ADVISOR");
      const examiners = assigned.filter((item) => String(item.role || "").toUpperCase() === "EXAMINER");

      setAdvisorsPool(advisors);
      setExaminersPool(examiners);
    } catch (err) {
      console.error("Failed to load staff pools for active intern detail", err);
    }
  };

  const openStudentDetail = async (app) => {
    setInternDetailTab("logbook");
    pushDebug(`openStudentDetail invoked for id=${app && app.id}`);
    try {
      if (app && app.id) {
        pushDebug(`fetching /applications/${app.id}`);
        const res = await internshipService.getApplication(app.id);
        if (res && res.success && res.data) {
          pushDebug(`API returned success for id=${app.id}`);
          const live = res.data;
          setSelectedIntern(live);
          // Try to fetch live logbook entries from API first
          try {
            const studentIdentifier =
              live.student_user_id || live.studentUserId || live.student_id || live.studentId || live.form_snapshot?.student?.student_id || live.form_snapshot?.student?.id || null;
            const lbRes = await logbookService.getLogbooksForStudent(studentIdentifier);
            if (lbRes && lbRes.success && lbRes.data) {
              const apiLog = Array.isArray(lbRes.data) ? lbRes.data[0] : lbRes.data;
              const mapped = {
                meta: {
                  studentName: live?.form_snapshot?.student?.name || live.student_name || live.studentName || "",
                  companyName: live?.form_snapshot?.company?.name || live.company_name || live.companyName || "",
                  supervisorName: apiLog?.supervisor_name || apiLog?.supervisor || "",
                  safetyBrief: apiLog?.safety_brief || "",
                },
                weeks: apiLog?.weeks || apiLog?.entries || apiLog?.records || [],
              };
              setLogbookRecord(mapped);
              await loadStaffPoolsForDepartment(
                live?.form_snapshot?.student?.department ||
                live?.form_snapshot?.student?.department_name ||
                live?.studentFull?.department ||
                coordinatorDept
              );
              return;
            }
          } catch (e) {
            pushDebug(`logbook fetch error for id=${app.id} -> ${e?.message || e}`);
          }

          // Fallback to existing local derivation
          setLogbookRecord(getLogbookForApplication(live));
          await loadStaffPoolsForDepartment(
            live?.form_snapshot?.student?.department ||
            live?.form_snapshot?.student?.department_name ||
            live?.studentFull?.department ||
            coordinatorDept
          );
          return;
        }
        pushDebug(`API returned failure for id=${app.id} -> ${JSON.stringify(res?.error || res?.data || res)}`);
      }
    } catch (err) {
      pushDebug(`API error for id=${app && app.id} -> ${err?.message || err}`);
      console.warn("Failed to load application from API, falling back to local", err);
    }

    // Fallback to local data if API call fails
    pushDebug(`falling back to local data for id=${app && app.id}`);
    setSelectedIntern(app);
    try {
      const studentIdentifier =
        app?.student_user_id || app?.studentUserId || app?.student_id || app?.studentId || app?.form_snapshot?.student?.student_id || app?.form_snapshot?.student?.id || null;
      const lbRes = await logbookService.getLogbooksForStudent(studentIdentifier);
      if (lbRes && lbRes.success && lbRes.data) {
        const apiLog = Array.isArray(lbRes.data) ? lbRes.data[0] : lbRes.data;
        const mapped = {
          meta: {
            studentName: app?.form_snapshot?.student?.name || app.studentName || app.student_name || "",
            companyName: app?.form_snapshot?.company?.name || app.companyName || app.company_name || "",
            supervisorName: apiLog?.supervisor_name || apiLog?.supervisor || "",
            safetyBrief: apiLog?.safety_brief || "",
          },
          weeks: apiLog?.weeks || apiLog?.entries || apiLog?.records || [],
        };
        setLogbookRecord(mapped);
        await loadStaffPoolsForDepartment(
          app?.form_snapshot?.student?.department ||
          app?.form_snapshot?.student?.department_name ||
          app?.studentFull?.department ||
          coordinatorDept
        );
        return;
      }
    } catch (e) {
      pushDebug(`logbook fallback error for id=${app && app.id} -> ${e?.message || e}`);
    }

    setLogbookRecord(getLogbookForApplication(app));
    await loadStaffPoolsForDepartment(
      app?.form_snapshot?.student?.department ||
      app?.form_snapshot?.student?.department_name ||
      app?.studentFull?.department ||
      coordinatorDept
    );
  };

  const debugOpenDirect = async (app) => {
    // explicit debug action triggered by debug button
    pushDebug(`DEBUG open triggered for id=${app && app.id}`);
    await openStudentDetail(app);
  };

  const closeStudentDetail = () => {
    setSelectedIntern(null);
    setLogbookRecord(null);
  };

  useEffect(() => {
    if (!selectedIntern) return;
    const fresh = activeInterns.find((a) => a.id === selectedIntern.id);
    if (fresh) {
      setSelectedIntern(fresh);
      setLogbookRecord(getLogbookForApplication(fresh));
    }
  }, [activeInterns, selectedIntern?.id]);

  useEffect(() => {
    const bump = () => setProgressDataNonce((n) => n + 1);
    window.addEventListener("storage", bump);
    return () => window.removeEventListener("storage", bump);
  }, []);

  // Sync documents from API so coordinator sees student-uploaded files
  useEffect(() => {
    let mounted = true;
    const syncDocs = async () => {
      try {
        const [advRes, exRes] = await Promise.all([
          internshipService.getAdvisorDocuments(),
          internshipService.getExaminerDocuments(),
        ]);

        const advItems = advRes?.success
          ? (Array.isArray(advRes.data) ? advRes.data : (advRes.data?.results || []))
          : [];
        const exItems = exRes?.success
          ? (Array.isArray(exRes.data) ? exRes.data : (exRes.data?.results || []))
          : [];

        const combined = [...advItems, ...exItems];
        if (!mounted) return;
        if (combined.length > 0) {
          syncInternshipDocumentsFromApi(combined, { merge: true });
        }
      } catch (err) {
        console.debug("Coordinator document sync failed:", err);
      }
    };

    syncDocs();
    const timer = setInterval(syncDocs, 1000 * 60 * 2); // refresh every 2 minutes
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const studentDocuments = useMemo(() => {
    if (!selectedIntern) return [];
    return getDocumentsByStudentId(selectedIntern.studentId);
  }, [selectedIntern, progressDataNonce]);

  const studentAdvisorEval = useMemo(() => {
    if (!selectedIntern) return null;
    return advisorEvalRecord;
  }, [selectedIntern, advisorEvalRecord]);

  // Load advisor evaluation from API whenever the selected intern changes
  useEffect(() => {
    setAdvisorEvalRecord(null);
    if (!selectedIntern?.id) return;
    (async () => {
      try {
        const res = await evaluationService.getAdvisorEvaluationForInternship(selectedIntern.id);
        if (res.success && res.data) {
          // Scale DB values back up to the frontend's display range
          const d = res.data;
          const unscale = (dbVal, dbMax, frontendMax) =>
            dbMax === 0 ? 0 : Math.round((dbVal ?? 0) / dbMax * frontendMax);
          setAdvisorEvalRecord({
            submittedAt: d.submitted_at,
            advisorName: d.advisor_name || "",
            formData: {
              // Arrays matching ADVISOR_EVAL_REPORT_ITEMS order (7 items)
              reportScores: [
                unscale(d.report_format_score,           2,  4),
                unscale(d.organization_background_score, 3,  4),
                unscale(d.activities_score,              4,  6),
                unscale(d.data_figure_table_score,       3,  8),
                unscale(d.report_content_score,          4, 10),
                unscale(d.recommendation_score,          2,  4),
                unscale(d.conclusion_score,              2,  4),
              ],
              // Arrays matching ADVISOR_EVAL_LOGBOOK_ITEMS order (5 items)
              logbookScores: [
                unscale(d.pictures_and_data_score, 1, 5),
                unscale(d.weekly_summary_score,    1, 5),
                unscale(d.daily_detail_score,      1, 5),
                unscale(d.improvement_score,       1, 5),
                unscale(d.initiative_score,        1, 5),
              ],
              // Arrays matching ADVISOR_EVAL_PERFORMANCE_ITEMS order (3 items)
              performanceScores: [
                unscale(d.understanding_objective_score, 4, 10),
                unscale(d.engagement_score,              3,  6),
                unscale(d.discipline_score,              3,  2),
              ],
            },
            totals: {
              reportTotal: d.report_total,
              logbookTotal: d.logbook_total,
              performanceTotal: d.student_performance_total,
              totalMarks: d.total_marks,
              finalWeightedMark: d.final_weighted_mark,
            },
            apiId: d.id,
            apiStatus: d.status,
          });
        }
      } catch (err) {
        console.warn("Failed to load advisor evaluation from API:", err.message);
      }

      // Fetch company monthly evaluations for this intern
      try {
        const mRes = await evaluationService.getAdvisorMonthlyEvaluations({ internship_id: selectedIntern.id });
        if (mRes.success) {
          const items = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.results || []);
          const map = {};
          items.forEach((item) => {
            if (!map[item.internship]) map[item.internship] = {};
            map[item.internship][item.month_number] = item;
          });
          setApiMonthlyEvals(map);
        }
      } catch (err) {
        console.warn("Failed to load monthly evals from API:", err.message);
      }

      // Fetch examiner evaluations for this intern
      try {
        const eRes = await evaluationService.getExaminerEvaluationsForAdvisor({ internship_id: selectedIntern.id });
        if (eRes.success) {
          const items = Array.isArray(eRes.data) ? eRes.data : (eRes.data?.results || []);
          setApiExaminerEvals(items.map((item) => ({
            id: item.id,
            internshipId: item.internship,
            examinerName: item.examiner_name || "",
            formData: item.form_data || {},
            totalScore: item.total_score,
            weightedScore: item.weighted_score,
            submittedAt: item.submitted_at,
          })));
        }
      } catch (err) {
        console.warn("Failed to load examiner evals from API:", err.message);
      }
    })();
  }, [selectedIntern?.id]);

  const studentExaminerEvals = useMemo(() => {
    if (!selectedIntern) return { ev1: null, ev2: null };

    if (apiExaminerEvals.length > 0) {
      // Index-based: first = ev1, second = ev2; also try name matching
      const slotNorm1 = String(selectedIntern.examinerName || "").trim().toLowerCase();
      const slotNorm2 = String(selectedIntern.examiner2Name || "").trim().toLowerCase();

      let ev1 = null, ev2 = null;
      if (slotNorm1 || slotNorm2) {
        ev1 = apiExaminerEvals.find((e) => String(e.examinerName || "").trim().toLowerCase() === slotNorm1 && slotNorm1) || null;
        ev2 = apiExaminerEvals.find((e) => String(e.examinerName || "").trim().toLowerCase() === slotNorm2 && slotNorm2) || null;
      }
      if (!ev1 && !ev2) {
        ev1 = apiExaminerEvals[0] || null;
        ev2 = apiExaminerEvals[1] || null;
      } else if (!ev2 && apiExaminerEvals.length > 1) {
        ev2 = apiExaminerEvals.find((e) => e !== ev1) || null;
      } else if (!ev1 && apiExaminerEvals.length > 0) {
        ev1 = apiExaminerEvals.find((e) => e !== ev2) || null;
      }
      return { ev1, ev2 };
    }

    // Fallback to localStorage
    return {
      ev1: getExaminerEvaluationForAdvisorSlot(selectedIntern.studentId, selectedIntern.examinerName),
      ev2: getExaminerEvaluationForAdvisorSlot(selectedIntern.studentId, selectedIntern.examiner2Name),
    };
  }, [selectedIntern, progressDataNonce, apiExaminerEvals]);

  const docStatusPill = (status) => {
    if (status === ROLE_DOC_STATUS.APPROVED) return "bg-green-100 text-green-800 border-green-200";
    if (status === ROLE_DOC_STATUS.REJECTED) return "bg-red-100 text-red-800 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const formatStaffOption = (staff) => {
    const name = staff?.name || staff?.user_name || staff?.username || staff?.fullName || "Unknown";
    const role = String(staff?.role || "").trim().toUpperCase();
    return role ? `${name} (${role})` : name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            {selectedIntern ? "Intern details" : "Active interns"}
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            {selectedIntern
              ? selectedIntern.studentName
              : `Select a student to view details and assign staff · ${coordinatorDept}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIntern && (
            <button
              type="button"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
              onClick={closeStudentDetail}
            >
              ← Back to list
            </button>
          )}
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition" onClick={onBack}>
            ← Dashboard
          </button>
        </div>
        
      </div>

      {/* Visible debug panel */}
      <div className="mb-4">
        {debugLogs.length > 0 && (
          <div className="rounded-md border border-slate-200 bg-gray-50 p-3 text-xs text-slate-700">
            <div className="font-semibold text-sm text-slate-900 mb-2">Debug log</div>
            <ul className="max-h-40 overflow-auto">
              {debugLogs.map((m, i) => (
                <li key={i} className="truncate">{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {activeInterns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-6 py-14 text-center">
          <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-900">No active interns yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Students appear here after coordinator approval is finalized.</p>
        </div>
      ) : !selectedIntern ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeInterns.map((app) => {
            const done = app.advisorName && app.examinerName && app.examiner2Name;
            return (
              <div
                key={app.id}
                role="button"
                tabIndex={0}
                onClick={() => openStudentDetail(app)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStudentDetail(app);
                  }
                }}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
                    {app.studentName?.[0] || "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">{app.studentName}</h3>
                    <p className="text-xs text-slate-500">ID {app.studentId}</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-sm text-slate-600">{app.companyName}</p>
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-xs font-semibold text-indigo-600">View details →</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); debugOpenDirect(app); }}
                    className="text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200"
                  >🐞 Debug</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {activeInterns.filter((a) => a.id === selectedIntern.id).map((app) => (
              <li key={app.id} className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white">
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
                              className="mt-3 w-full rounded-md bg-indigo-600 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-indigo-700 disabled:opacity-50"
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
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                        Academic advisor
                      </label>
                      {app.advisorName ? (
                        <div className="group/slot relative">
                          <div className="flex items-center justify-between rounded-md border border-indigo-300 bg-white px-3 py-2.5">
                            <span className="text-sm font-medium text-indigo-900">{app.advisorName}</span>
                            <CheckCircle className="h-4 w-4 text-indigo-500" />
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
                          key={`advisor-${app.id}-${selectResetKey}`}
                          onChange={(e) => handleUpdateAssignmentApi(app.id, "advisorName", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
                          value={app.advisorName || ""}
                        >
                          <option value="" disabled>
                            Select advisor…
                          </option>
                          {advisorsPool.map((s) => (
                            <option key={s.id} value={s.name}>
                              {formatStaffOption(s)}
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
                          key={`examiner1-${app.id}-${selectResetKey}`}
                          onChange={(e) => handleUpdateAssignmentApi(app.id, "examinerName", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-purple-500"
                          value={app.examinerName || ""}
                        >
                          <option value="" disabled>
                            {examinersPool.length > 0 ? "Select examiner 1…" : "No examiners — pick from advisors…"}
                          </option>
                          {(examinersPool.length > 0 ? examinersPool : advisorsPool).map((s) => (
                            <option key={s.id} value={s.name}>
                              {formatStaffOption(s)}
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
                          key={`examiner2-${app.id}-${selectResetKey}`}
                          onChange={(e) => handleUpdateAssignmentApi(app.id, "examiner2Name", e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
                          value={app.examiner2Name || ""}
                        >
                          <option value="" disabled>
                            {examinersPool.length > 0 ? "Select examiner 2…" : "No examiners — pick from advisors…"}
                          </option>
                          {(examinersPool.length > 0 ? examinersPool : advisorsPool).map((s) => (
                            <option key={s.id} value={s.name}>
                              {formatStaffOption(s)}
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

          <div className="border-t border-slate-200 p-4 sm:p-6">
            <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-700">Internship progress</h4>
            <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setInternDetailTab("logbook")}
                className={progressTabClass("logbook")}
              >
                <BookOpen className="h-4 w-4 shrink-0" /> Weekly Logbook
              </button>
              <button type="button" onClick={() => setInternDetailTab("documents")} className={progressTabClass("documents")}>
                <FileText className="h-4 w-4 shrink-0" /> Student Documents
              </button>
              <button type="button" onClick={() => setInternDetailTab("monthly")} className={progressTabClass("monthly")}>
                <ClipboardList className="h-4 w-4 shrink-0" /> Company Monthly Evaluation
              </button>
              <button type="button" onClick={() => setInternDetailTab("company-final")} className={progressTabClass("company-final")}>
                <ClipboardList className="h-4 w-4 shrink-0" /> Company Overall Evaluation
              </button>
              <button type="button" onClick={() => setInternDetailTab("advisor-eval")} className={progressTabClass("advisor-eval")}>
                <GraduationCap className="h-4 w-4 shrink-0" /> Advisor Evaluation
              </button>
              <button type="button" onClick={() => setInternDetailTab("examiner-1")} className={progressTabClass("examiner-1")}>
                <User className="h-4 w-4 shrink-0" /> Examiner 1 Evaluation
              </button>
              <button type="button" onClick={() => setInternDetailTab("examiner-2")} className={progressTabClass("examiner-2")}>
                <User className="h-4 w-4 shrink-0" /> Examiner 2 Evaluation
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
                        let badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
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
                  const internshipId = String(selectedIntern?.id || "");
                  const apiRec = internshipId && apiMonthlyEvals[internshipId]?.[month];
                  const rec = apiRec
                    ? {
                        status: apiRec.status === "ADVISOR_APPROVED" ? EVAL_STATUS.APPROVED
                               : apiRec.status === "REJECTED" ? EVAL_STATUS.REJECTED
                               : EVAL_STATUS.SUBMITTED,
                        advisorComment: apiRec.advisor_comment || "",
                        evaluationData: {
                          ...(apiRec.form_data || {}),
                          totalMarks: apiRec.total_score,
                          monthlyPerformance: apiRec.total_score,
                        },
                      }
                    : getEvaluation(selectedIntern.studentId, month);
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
            {internDetailTab === "documents" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Files the student uploaded for advisor and examiner review (read only).
                </p>
                {studentDocuments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No student documents uploaded yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {studentDocuments.map((doc) => {
                      const summary = getStudentDocumentSummary(doc);
                      return (
                        <li key={doc.id} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 sm:p-5">
                          <div className="flex flex-wrap justify-between gap-2 items-start">
                            <div>
                              <h4 className="font-bold text-gray-900">{doc.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted {new Date(doc.submittedAt).toLocaleString()}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                              )}
                            </div>
                            <a
                              href={doc.fileData}
                              download={doc.fileName}
                              className="text-sm font-bold text-indigo-600 hover:underline shrink-0"
                            >
                              Download
                            </a>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 mt-3">{summary.text}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${docStatusPill(doc.advisorStatus)}`}>
                              Advisor: {doc.advisorStatus}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${docStatusPill(doc.examinerStatus)}`}>
                              Examiner: {doc.examinerStatus}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {internDetailTab === "company-final" && selectedIntern && (
              <div className="space-y-6">
                {(() => {
                  const finalEval = getFinalEvaluation(selectedIntern.studentId);
                  if (!finalEval) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No company overall evaluation submitted yet.</p>
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
                        <h4 className="font-bold text-gray-900">Company Overall Evaluation</h4>
                        <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${badgeMap[finalEval.status] || badgeMap[FINAL_EVAL_STATUS.NOT_STARTED]}`}>
                          {FINAL_EVAL_STATUS_LABELS[finalEval.status]}
                        </span>
                      </div>
                      {finalEval.total !== undefined && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center bg-white rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-400 font-medium mb-1">Total Score</p>
                            <p className="text-2xl font-bold text-indigo-700">{finalEval.total} / 60</p>
                          </div>
                          <div className="text-center bg-white rounded-lg border border-gray-100 p-3">
                            <p className="text-xs text-gray-400 font-medium mb-1">Final Mark</p>
                            <p className="text-2xl font-bold text-green-700">{finalEval.finalMark} / 20</p>
                          </div>
                        </div>
                      )}
                      <InternshipEvaluationForm
                        key={`coord-final-${selectedIntern.studentId}`}
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

            {internDetailTab === "advisor-eval" && selectedIntern && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Academic advisor evaluation for this student (read only).
                </p>
                {!studentAdvisorEval ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Advisor has not submitted their evaluation yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(studentAdvisorEval.submittedAt).toLocaleString()}
                        {studentAdvisorEval.advisorName && (
                          <span className="block mt-1 font-semibold text-gray-800">
                            Advisor: {studentAdvisorEval.advisorName}
                          </span>
                        )}
                      </p>
                      {studentAdvisorEval.totals && (
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Total: <span className="font-bold text-indigo-700">{studentAdvisorEval.totals.totalMarks} / 100</span></p>
                          <p className="text-gray-500">Weighted: <span className="font-bold text-green-700">{studentAdvisorEval.totals.finalWeightedMark} / 35</span></p>
                        </div>
                      )}
                    </div>
                    <AdvisorStudentEvaluationForm
                      readOnly
                      initialData={{
                        ...(studentAdvisorEval.formData || {}),
                        studentName: selectedIntern.studentName || selectedIntern.student_name || "",
                        idNo: selectedIntern.studentId || selectedIntern.form_snapshot?.student?.student_id || "",
                        department: selectedIntern.department || selectedIntern.form_snapshot?.student?.department || "",
                        organization: selectedIntern.companyName || selectedIntern.company_name || "",
                        supervisorName:
                          studentAdvisorEval.formData?.supervisorName ||
                          studentAdvisorEval.advisorName ||
                          "",
                      }}
                    />
                  </>
                )}
              </div>
            )}

            {internDetailTab === "examiner-1" && selectedIntern && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Examiner 1{(selectedIntern.examinerName || studentExaminerEvals.ev1?.examinerName) ? ` — ${selectedIntern.examinerName || studentExaminerEvals.ev1?.examinerName}` : ""}
                </h4>
                {!studentExaminerEvals.ev1 ? (
                  <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                    Examiner 1 has not submitted an evaluation yet.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(studentExaminerEvals.ev1.submittedAt).toLocaleString()}
                    </p>
                    <ExaminerUniversityEvaluationForm
                      readOnly
                      initialData={{
                        ...(studentExaminerEvals.ev1.formData || {}),
                        studentName: selectedIntern.studentName || "",
                        idNo: selectedIntern.studentId || "",
                        department: selectedIntern.department || "",
                        organization: selectedIntern.companyName || "",
                        examinerName:
                          studentExaminerEvals.ev1.examinerName ||
                          studentExaminerEvals.ev1.formData?.examinerName ||
                          "",
                      }}
                    />
                  </>
                )}
              </div>
            )}

            {internDetailTab === "examiner-2" && selectedIntern && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Examiner 2{(selectedIntern.examiner2Name || studentExaminerEvals.ev2?.examinerName) ? ` — ${selectedIntern.examiner2Name || studentExaminerEvals.ev2?.examinerName}` : ""}
                </h4>
                {!studentExaminerEvals.ev2 ? (
                  <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                    Examiner 2 has not submitted an evaluation yet.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(studentExaminerEvals.ev2.submittedAt).toLocaleString()}
                    </p>
                    <ExaminerUniversityEvaluationForm
                      readOnly
                      initialData={{
                        ...(studentExaminerEvals.ev2.formData || {}),
                        studentName: selectedIntern.studentName || "",
                        idNo: selectedIntern.studentId || "",
                        department: selectedIntern.department || "",
                        organization: selectedIntern.companyName || "",
                        examinerName:
                          studentExaminerEvals.ev2.examinerName ||
                          studentExaminerEvals.ev2.formData?.examinerName ||
                          "",
                      }}
                    />
                  </>
                )}
              </div>
            )}

        </div>
      )}
    </div>
  );
};

const COORDINATOR_HOME_TILES = [
  { view: "staff", title: "Staff list", description: "View unassigned staff and invite advisors or examiners.", icon: Users, accent: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
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
    const raw = app.__raw || app;
    const status = String(app.finalInternshipStatus || raw.status || raw.dept_status || "").toUpperCase();
    const isActive = status === "ACTIVE_INTERN" || status === "ONGOING" || raw.dept_status === "APPROVED";
    const student = students.find(
      (s) => String(s.studentId || s.id || "") === String(app.studentId || app.student_id || "") || String(s.name || s.fullName || s.full_name || "") === String(app.studentName || "")
    );
    const resolvedDept = normalize(student?.department || raw?.form_snapshot?.student?.department || raw?.department || "");
    if (useDeptFilter && resolvedDept !== deptNorm) return;
    if (app.coordinatorApprovalStatus === "PENDING" || raw.dept_status === "PENDING") pendingApprovals += 1;
    if (isActive) activeInterns += 1;
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

function getCoordinatorActiveInterns(coordinatorDept) {
  const allApps = JSON.parse(localStorage.getItem("applications") || "[]");
  const students = JSON.parse(localStorage.getItem("students") || "[]");
  const deptNorm = String(coordinatorDept || "").trim().toLowerCase();
  const useDeptFilter = deptNorm.length > 0;
  return allApps.filter((app) => {
    const raw = app.__raw || app;
    const status = String(app.finalInternshipStatus || raw.status || raw.dept_status || "").toUpperCase();
    const isActive = status === "ACTIVE_INTERN" || status === "ONGOING" || raw.dept_status === "APPROVED";
    if (!isActive) return false;
    if (!useDeptFilter) return true;
    const student = students.find(
      (s) => String(s.studentId || s.id || "") === String(app.studentId || app.student_id || "") || String(s.name || s.fullName || s.full_name || "") === String(app.studentName || "")
    );
    const resolvedDept = String(student?.department || raw?.form_snapshot?.student?.department || raw?.department || "").trim().toLowerCase();
    return resolvedDept === deptNorm;
  });
}

const CoordinatorDashboard = () => {
  const [coordinatorDept, setCoordinatorDept] = useState(() => getCoordinatorDepartment());
  const [coordinatorName, setCoordinatorName] = useState(() => getCoordinatorName());
  const [mockStaff, setMockStaff] = useState([]);
  const [assignedAdvisors, setAssignedAdvisors] = useState([]);
  const [assignedExaminers, setAssignedExaminers] = useState([]);
  const [view, setView] = useState("home");
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [homeMetricsNonce, setHomeMetricsNonce] = useState(0);
  const [overallNonce, setOverallNonce] = useState(0);
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

  useEffect(() => {
    const bump = () => setOverallNonce((n) => n + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("overall-evaluation-updated", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("overall-evaluation-updated", bump);
    };
  }, []);

  const coordinatorActiveInterns = useMemo(
    () => getCoordinatorActiveInterns(coordinatorDept),
    [coordinatorDept, overallNonce, view]
  );

  const pendingOverallQueue = useMemo(
    () =>
      coordinatorActiveInterns
        .map((app) => {
          const approvals = getOverallApprovals(app.studentId);
          if (approvals.coordinatorApproved) return null;
          if (!approvals.advisorApproved || !approvals.examiner1Approved || !approvals.examiner2Approved) {
            return null;
          }
          const overall = computeOverallEvaluation(app);
          if (!overall.complete) return null;
          return { app, overall, approvals };
        })
        .filter(Boolean),
    [coordinatorActiveInterns, overallNonce]
  );

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

  const assignAsAdvisor = async (staff) => {
    try {
      const res = await userService.assignStaffAsAdvisor(staff.user_id || staff.id, { department: staff.department });
      if (!res.success) throw new Error(res.error || "Assign failed");

      setMockStaff((prev) => prev.filter((s) => s.id !== staff.id && s.email !== staff.email));
      setAssignedAdvisors((prev) => [...prev.filter((a) => a.id !== staff.id && a.email !== staff.email), { ...staff, role: "ADVISOR", is_assigned: true }]);
      setAssignedExaminers((prev) => prev.filter((a) => a.id !== staff.id && a.email !== staff.email));
      showToast(`Assigned ${staff.email} as advisor.`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to assign advisor: ${err.message || err}`);
    }
  };

  const assignAsExaminer = async (staff) => {
    try {
      const res = await userService.assignStaffAsExaminer(staff.user_id || staff.id, { department: staff.department });
      if (!res.success) throw new Error(res.error || "Assign failed");

      setMockStaff((prev) => prev.filter((s) => s.id !== staff.id && s.email !== staff.email));
      setAssignedExaminers((prev) => [...prev.filter((a) => a.id !== staff.id && a.email !== staff.email), { ...staff, role: "EXAMINER", is_assigned: true }]);
      setAssignedAdvisors((prev) => prev.filter((a) => a.id !== staff.id && a.email !== staff.email));
      showToast(`Assigned ${staff.email} as examiner.`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to assign examiner: ${err.message || err}`);
    }
  };

  const unassignStaff = async (staff) => {
    try {
      const res = await userService.unassignStaff(staff.id, { department: staff.department });
      if (!res.success) throw new Error(res.error || "Unassign failed");

      const updatedStaff = { ...staff, is_assigned: false };
      setAssignedAdvisors((prev) => prev.filter((item) => item.id !== staff.id && item.email !== staff.email));
      setAssignedExaminers((prev) => prev.filter((item) => item.id !== staff.id && item.email !== staff.email));
      setMockStaff((prev) => [...prev.filter((item) => item.id !== staff.id && item.email !== staff.email), updatedStaff]);
      showToast(`Unassigned ${staff.email}.`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to unassign staff: ${err.message || err}`);
    }
  };

  const handleFileUpload = async () => {
    setFileError("");
    setFileSuccess("");
    if (!selectedFile) { setFileError("Please select a JSON file first."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) { setFileError("Invalid student file format"); return; }

        const normalized = data.map((item) => ({
          studentId: String(item.studentId || item.student_id || item.id || "").trim(),
          fullName: String(item.fullName || item.full_name || item.name || "").trim(),
          email: String(item.email || "").trim(),
          department: String(item.department || "").trim(),
        }));

        const valid = normalized.every((item) => item.studentId && item.fullName && item.department);
        if (!valid) { setFileError("Invalid student file format"); return; }

        userService.uploadEligibleStudents(normalized).then((res) => {
          if (!res.success) {
            const apiError = res.error || {};
            const message = typeof apiError === "string"
              ? apiError
              : apiError.error || apiError.detail || apiError.message || "Failed to upload eligible students.";
            setFileError(message);
            return;
          }

          localStorage.setItem("eligibleStudents", JSON.stringify(normalized));
          window.dispatchEvent(new CustomEvent("eligibleStudentsUpdated"));
          const count = res.data?.count || normalized.length;
          setFileSuccess(`Eligible students uploaded successfully (${count}).`);
          setSelectedFile(null);
        }).catch((err) => {
          const message = err?.message || "Failed to upload eligible students.";
          setFileError(message);
        });
      } catch { setFileError("Invalid student file format"); }
    };
    reader.onerror = () => setFileError("Failed to read file.");
    reader.readAsText(selectedFile);
  };

  // Load staff/advisors/examiners from API (fall back to localStorage/mock)
  useEffect(() => {
    const fetchStaffData = async () => {
      const deptRaw = (getCoordinatorDepartment() || coordinatorDept || "").trim();
      const dept = deptRaw.length > 0 ? deptRaw : "";

      try {
        const [unassignedRes, assignedRes] = await Promise.all([
          userService.getUnassignedStaff({ department: dept }),
          userService.getAssignedStaff({ department: dept }),
        ]);

        const assigned = assignedRes && assignedRes.success ? (assignedRes.data || []) : [];
        const advisors = assigned.filter((item) => String(item.role || "").toUpperCase() === "ADVISOR");
        const examiners = assigned.filter((item) => String(item.role || "").toUpperCase() === "EXAMINER");

        setAssignedAdvisors(advisors);
        setAssignedExaminers(examiners);
        try { localStorage.setItem("assignedAdvisors", JSON.stringify(advisors)); } catch {}
        try { localStorage.setItem("assignedExaminers", JSON.stringify(examiners)); } catch {}

        if (unassignedRes && unassignedRes.success) {
          setMockStaff(unassignedRes.data || []);
        } else {
          // Fallback: generate lightweight mock pool and subtract assigned
          const key = (dept || "department").toString().replace(/\s+/g, "").toLowerCase();
          const currAdvisors = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
          const currExaminers = JSON.parse(localStorage.getItem("assignedExaminers") || "[]");
          const deptNorm = String(dept || "").trim().toLowerCase();

          const deptAdvisors = currAdvisors.filter(a => String(a.department || "").trim().toLowerCase() === deptNorm);
          const deptExaminers = currExaminers.filter(e => String(e.department || "").trim().toLowerCase() === deptNorm);

          const assignedIds = new Set([...deptAdvisors.map(a => a.id), ...deptExaminers.map(e => e.id)]);
          const assignedEmails = new Set([...deptAdvisors.map(a => String(a.email || "").toLowerCase()), ...deptExaminers.map(e => String(e.email || "").toLowerCase())]);

          const staff = Array.from({ length: 10 }).map((_, i) => {
            const idx = i + 1;
            return {
              id: `${key}-staff-${idx}`,
              name: `${dept || "Department"}Staff${idx}`,
              email: `${key}staff${idx}@mock.com`,
              department: dept || "",
              status: "unassigned",
            };
          }).filter(s => !assignedIds.has(s.id) && !assignedEmails.has(s.email.toLowerCase()));

          setMockStaff(staff);
        }
      } catch (err) {
        console.error("Failed to fetch staff data", err);
        // try localStorage fallback
        const allA = JSON.parse(localStorage.getItem("assignedAdvisors") || "[]");
        const allE = JSON.parse(localStorage.getItem("assignedExaminers") || "[]");
        setAssignedAdvisors(allA.filter(s => String(s.department || "").trim().toLowerCase() === String(deptRaw).trim().toLowerCase()));
        setAssignedExaminers(allE.filter(s => String(s.department || "").trim().toLowerCase() === String(deptRaw).trim().toLowerCase()));
        const key = (deptRaw || "department").toString().replace(/\s+/g, "").toLowerCase();
        const staff = Array.from({ length: 10 }).map((_, i) => ({
          id: `${key}-staff-${i+1}`,
          name: `${deptRaw || "Department"}Staff${i+1}`,
          email: `${key}staff${i+1}@mock.com`,
          department: deptRaw || "",
          status: "unassigned",
        }));
        setMockStaff(staff);
      }
    };

    fetchStaffData();
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
    <div className="app-shell flex min-h-screen flex-col">
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
            <div className="flex min-w-0 max-w-[160px] items-center gap-2 rounded-lg px-2 py-2 sm:max-w-none sm:px-3">
              <span className="truncate text-sm font-medium text-slate-700">{coordinatorName}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <CoordinatorSidebar
          currentView={view}
          coordinatorName={coordinatorName}
          onNavigate={navigateCoordinator}
          pendingOverall={pendingOverallQueue.length}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
                  return (
                    <button
                      key={tile.view}
                      type="button"
                      onClick={() => navigateCoordinator(tile.view)}
                      className="app-card group flex w-full flex-col items-start gap-3 p-5 text-left transition-all hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tile.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{tile.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
                      </div>
                      <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
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

          {view === "overall-queue" && (
            <div className="max-w-5xl">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Overall evaluation queue</h2>
                  <p className="text-gray-600">
                    Final sign-off for your department. Approve after advisor and both examiners have approved.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
                  onClick={() => navigateCoordinator("home")}
                >
                  ← Back
                </button>
              </div>
              {coordinatorActiveInterns.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No active interns in your department.</p>
              ) : pendingOverallQueue.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No overall evaluations waiting for coordinator approval.</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    Items appear when all component evaluations are complete and advisor plus both examiners have approved.
                  </p>
                </div>
              ) : (
                <div className="space-y-6" key={overallNonce}>
                  {pendingOverallQueue.map(({ app, overall, approvals }) => (
                    <div key={app.id} className="border border-indigo-100 rounded-xl p-4 sm:p-6 bg-white shadow-sm space-y-4">
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
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-[10px] font-black uppercase text-gray-500">Advisor</p>
                          <p className="text-base font-bold text-gray-900 mt-1">
                            {overall.advisorMark != null ? `${overall.advisorMark} / 35` : "—"}
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-[10px] font-black uppercase text-gray-500">Examiner 1</p>
                          <p className="text-base font-bold text-gray-900 mt-1">
                            {overall.ex1Mark != null ? `${overall.ex1Mark} / 25` : "—"}
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-[10px] font-black uppercase text-gray-500">Examiner 2</p>
                          <p className="text-base font-bold text-gray-900 mt-1">
                            {overall.ex2Mark != null ? `${overall.ex2Mark} / 25` : "—"}
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-[10px] font-black uppercase text-gray-500">Company</p>
                          <p className="text-base font-bold text-gray-900 mt-1">
                            {overall.companyTotal40 != null ? `${overall.companyTotal40} / 40` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                        <span className="px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                          Advisor: Approved
                        </span>
                        <span className="px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                          Examiner 1: Approved
                        </span>
                        <span className="px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                          Examiner 2: Approved
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full border ${
                            approvals.coordinatorApproved
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          Coordinator: {approvals.coordinatorApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          approveOverallAsCoordinator(app.studentId);
                          setOverallNonce((n) => n + 1);
                          showToast(`Overall evaluation approved for ${app.studentName}.`);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                      >
                        Approve overall evaluation (Coordinator)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPLOAD */}
          {view === "upload" && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Eligible Students</h2>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
              </div>
              {fileError && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">{fileError}</div>}
              {fileSuccess && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md text-sm">{fileSuccess}</div>}
              <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">Select JSON File</label>
                <input
                  type="file" accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button type="button" onClick={handleFileUpload} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700">
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
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
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
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
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
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span className="shrink-0 self-start rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 sm:self-center">{s.role || s.status || "ADVISOR"}</span>
                          <button type="button" onClick={() => unassignStaff(s)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Unassign
                          </button>
                        </div>
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
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition" onClick={() => navigateCoordinator("home")}>← Back</button>
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
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span className="shrink-0 self-start rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-900 sm:self-center">{s.role || s.status || "EXAMINER"}</span>
                          <button type="button" onClick={() => unassignStaff(s)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Unassign
                          </button>
                        </div>
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
    </div>
  );
};

export default CoordinatorDashboard;
