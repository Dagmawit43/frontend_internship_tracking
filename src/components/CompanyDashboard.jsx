import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell, ChevronDown, Plus, Edit2, Trash2, ChevronUp, MapPin,
  Building2, Briefcase, GraduationCap, Clock, Layers, User, Mail,
  XCircle, FileText, Users, ClipboardList, AlertCircle, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import CompanySidebar from "./CompanySidebar";
import { DEPARTMENTS } from "../constants/departments";
import InternshipAcceptanceForm from "./InternshipAcceptanceForm";
import InternshipLogbookForm from "./InternshipLogbookForm";
import InternshipMonthlyEvaluation from "./InternshipMonthlyEvaluation";
import InternshipEvaluationForm from "./InternshipEvaluationForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  ensureWeeklyLogbookForInternship,
  updateWeekForInternship,
  updateWeeklyLogbookMeta,
} from "../utils/weeklyLogbook";
import {
  EVAL_STATUS,
  EVAL_STATUS_LABELS,
  getEvaluation,
  submitEvaluation,
} from "../utils/monthlyEvaluations";
import {
  FINAL_EVAL_STATUS,
  FINAL_EVAL_STATUS_LABELS,
  getFinalEvaluation,
  submitFinalEvaluation,
} from "../utils/finalEvaluations";
import {
  getAdvisorEvaluation,
  ADVISOR_EVAL_STATUS,
} from "../utils/advisorEvaluations";
import AdvisorStudentEvaluationForm from "./AdvisorStudentEvaluationForm";

// ─── session helper ───────────────────────────────────────────────────────────
const getValidCompanySession = () => {
  try {
    for (const key of ["company", "user"]) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === "null" || raw === "undefined") continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        if (
          parsed.companyName || parsed.company_name ||
          parsed.contactEmail || parsed.representative_email ||
          parsed.role === "Company"
        ) return parsed;
      } catch { continue; }
    }
    return {};
  } catch { return {}; }
};

// ─── InternshipModal ──────────────────────────────────────────────────────────
const InternshipModal = ({ isOpen, onClose, onSubmit, initialData, companySession }) => {
  const empty = {
    title: "", department: "", description: "", required_skills: "",
    company_name: companySession?.companyName || companySession?.company_name || "",
    location: "", internship_type: "Onsite", start_date: "", end_date: "",
    total_hours: "", days_in_week: "", number_interns: "", status: "PENDING",
  };
  const [formData, setFormData] = useState(empty);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        required_skills: Array.isArray(initialData.required_skills)
          ? initialData.required_skills.join(", ")
          : initialData.required_skills,
      });
    } else {
      setFormData(empty);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.required_skills.split(",").map(s => s.trim()).filter(Boolean);
    onSubmit({
      ...formData,
      required_skills: skillsArray,
      id: initialData ? initialData.id : Date.now().toString(),
      company_id: companySession?.id || companySession?.company_id || "mock-company-id",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="app-modal-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 scrollbar-hide">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? "Edit Internship" : "Create Internship"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internship Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Software Engineering Intern" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Department</label>
              <select required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input required type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Addis Ababa or Remote" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internship Type</label>
              <select required value={formData.internship_type} onChange={e => setFormData({ ...formData, internship_type: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24" placeholder="Describe the internship roles..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
            <input required type="text" value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="React, Node.js, Python" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input required type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <input required type="number" min="1" value={formData.total_hours} onChange={e => setFormData({ ...formData, total_hours: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="160" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days / Week</label>
              <input required type="number" min="1" max="7" value={formData.days_in_week} onChange={e => setFormData({ ...formData, days_in_week: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interns Needed</label>
              <input required type="number" min="1" value={formData.number_interns} onChange={e => setFormData({ ...formData, number_interns: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="5" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm">
              {initialData ? "Save Changes" : "Post Internship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── InternshipCard ───────────────────────────────────────────────────────────
const InternshipCard = ({ data, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const getStatusColor = (s) => {
    if (s === "ACTIVE") return "bg-green-100 text-green-700 border-green-200";
    if (s === "PENDING") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (s === "CLOSED") return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700";
  };
  return (
    <div className="app-card overflow-hidden mb-4">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(data.status)}`}>{data.status}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-600" /><span className="font-semibold text-gray-800">Company:</span> {data.company_name}</div>
              <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-purple-600" /><span className="font-semibold text-gray-800">Department:</span> {data.department}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600" /><span className="font-semibold text-gray-800">Location:</span> {data.location}</div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-600" /><span className="font-semibold text-gray-800">Type:</span> {data.internship_type}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(data)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(data.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /><span>{data.start_date} to {data.end_date}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><GraduationCap className="w-4 h-4" /><span>{data.number_interns} Interns Needed</span></div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
            {expanded ? <><ChevronUp className="w-4 h-4" /> Hide Details</> : <><ChevronDown className="w-4 h-4" /> View Details</>}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {data.required_skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold">{skill}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Hours</p>
                <p className="text-lg font-bold text-gray-900">{data.total_hours} <span className="text-xs font-normal">hrs</span></p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Days Per Week</p>
                <p className="text-lg font-bold text-gray-900">{data.days_in_week} <span className="text-xs font-normal">days</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AppliedStudentsPage ──────────────────────────────────────────────────────
const AppliedStudentsPage = ({ companySession }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const cName = companySession?.companyName || companySession?.company_name || "";

  useEffect(() => {
    const load = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const filtered = allApps.filter(app =>
        app.companyName === cName ||
        app.companyId === companySession?.id ||
        app.companyId === companySession?.company_id
      );
      setApplications(filtered.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [cName, companySession]);

  const handleUpdateStatus = (appId, acceptanceFormData) => {
    const newStatus = acceptanceFormData.accepted ? "accepted" : acceptanceFormData.rejected ? "rejected" : "Pending";
    const allApps = JSON.parse(localStorage.getItem("applications")) || [];
    const updated = allApps.map(app =>
      app.id === appId
        ? { ...app, acceptanceForm: acceptanceFormData, status: newStatus, applicationStatus: acceptanceFormData.accepted ? "COMPANY_ACCEPTED" : "COMPANY_REJECTED", updatedAt: new Date().toISOString() }
        : app
    );
    localStorage.setItem("applications", JSON.stringify(updated));
    setApplications(updated.filter(app => app.companyName === cName || app.companyId === companySession?.id || app.companyId === companySession?.company_id));
    const targetApp = updated.find(a => a.id === appId);
    if (targetApp) {
      const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
      notifications.push({ id: Date.now(), type: newStatus === "accepted" ? "success" : "error", title: "Application Status Updated", message: `${cName} has marked your application for ${targetApp.internshipTitle || "the internship"} as ${newStatus}.`, date: new Date().toISOString(), studentId: targetApp.studentId, studentName: targetApp.studentName, read: false });
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applied Students</h2>
          <p className="text-sm text-gray-500">Review and manage student application requests</p>
        </div>
      </div>
      {applications.length === 0 ? (
        <div className="app-card p-12 text-center">
          <User className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No applications yet</h3>
          <p className="text-gray-500">Student applications for your posted jobs will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map(app => (
            <div key={app.id} className="app-card p-6 transition-shadow hover:shadow-md">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="bg-indigo-50 h-16 w-16 rounded-xl flex items-center justify-center border border-indigo-100 flex-shrink-0">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight">{app.studentName}</h4>
                    <p className="text-sm text-indigo-600 font-semibold mb-1 italic">Applying for: {app.internshipTitle || "General Internship"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {app.studentId || "N/A"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 self-center sm:self-start">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${app.status === "accepted" ? "bg-green-100 text-green-700 border-green-200" : app.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>{app.status}</span>
                  {(app.status === "Pending" || app.status === "applied") ? (
                    <button onClick={() => setSelectedApplication(app)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                      <FileText className="w-4 h-4" /> Open Acceptance Form
                    </button>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium">Decision recorded</p>
                  )}
                </div>
              </div>
              {app.reason && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h5 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">Statement of Interest</h5>
                  <p className="text-sm text-gray-700 leading-relaxed italic mb-4">"{app.reason}"</p>
                  {app.additionalDocument && (
                    <div className="flex items-center gap-3 p-3 bg-white border border-indigo-100 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{app.documentName || "Student_CV.pdf"}</p>
                        <p className="text-[10px] text-gray-500">Uploaded Resume/CV</p>
                      </div>
                      <a href={app.additionalDocument} download={app.documentName || "CV.pdf"} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded hover:bg-indigo-100 transition-colors">Download</a>
                    </div>
                  )}
                </div>
              )}
              {app.acceptanceForm && (
                <div className="mt-4 p-3 border border-indigo-100 rounded-lg bg-indigo-50 text-sm text-indigo-700">
                  Acceptance form submitted: <span className="font-bold">{app.acceptanceForm.accepted ? "Accepted" : app.acceptanceForm.rejected ? "Rejected" : "Pending"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 z-[150] p-4 overflow-y-auto">
          <div className="app-modal-panel max-w-5xl mx-auto my-8 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Acceptance Form — {selectedApplication.studentName}</h3>
              <button onClick={() => setSelectedApplication(null)} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <InternshipAcceptanceForm
              initialData={selectedApplication.acceptanceForm}
              onSubmit={(formData) => { handleUpdateStatus(selectedApplication.id, formData); setSelectedApplication(null); }}
              readOnly={selectedApplication.status !== "Pending" && selectedApplication.status !== "applied"}
              showActions
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── InternshipPage ───────────────────────────────────────────────────────────
const InternshipPage = ({ companySession }) => {
  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem("allInternships");
    return saved ? JSON.parse(saved) : [
      { id: "1", title: "Software Engineer Intern", department: "Software Engineering", description: "Join our team to work on real-world projects.", required_skills: ["React", "JavaScript", "CSS"], company_name: companySession?.companyName || "AASTU Labs", location: "Addis Ababa", internship_type: "Onsite", start_date: "2026-06-01", end_date: "2026-09-01", total_hours: "160", days_in_week: "5", number_interns: "3", status: "ACTIVE" },
    ];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);

  useEffect(() => { localStorage.setItem("allInternships", JSON.stringify(internships)); }, [internships]);

  const handleSubmit = (data) => {
    if (editingInternship) setInternships(internships.map(i => i.id === data.id ? data : i));
    else setInternships([data, ...internships]);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internships</h2>
          <p className="text-sm text-gray-500">Post and manage your internship opportunities</p>
        </div>
        <button onClick={() => { setEditingInternship(null); setIsModalOpen(true); }} className="flex items-center gap-2 rounded-lg border border-indigo-700/10 bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
          <Plus className="w-5 h-5" /> Create Internship
        </button>
      </div>
      {internships.length === 0 ? (
        <div className="app-card p-12 text-center"><p className="text-gray-500">No internships posted yet.</p></div>
      ) : (
        <div className="space-y-4">
          {internships.map(internship => (
            <InternshipCard key={internship.id} data={internship} onEdit={(d) => { setEditingInternship(d); setIsModalOpen(true); }} onDelete={(id) => { if (window.confirm("Delete this internship?")) setInternships(internships.filter(i => i.id !== id)); }} />
          ))}
        </div>
      )}
      <InternshipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={editingInternship} companySession={companySession} />
    </div>
  );
};

// ─── InternsPage ──────────────────────────────────────────────────────────────
const InternsPage = ({ companySession }) => {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [internDetailTab, setInternDetailTab] = useState("logbook");
  const [openEvalMonth, setOpenEvalMonth] = useState(null);
  const [evalRecords, setEvalRecords] = useState({ 1: null, 2: null });
  const [finalEvalRecord, setFinalEvalRecord] = useState(null);
  /** True after "Start Final Evaluation" so the form shows while status is still NOT_STARTED */
  const [finalEvalDraftOpen, setFinalEvalDraftOpen] = useState(false);
  const [advisorEvalNonce, setAdvisorEvalNonce] = useState(0);
  const companyId = companySession?.id || companySession?.company_id;

  const emptyFinalFormData = () => ({
    studentName: "",
    idNo: "",
    department: "",
    organization: "",
    duration: "",
    sectionA: [0, 0, 0, 0, 0],
    sectionB: [0, 0, 0, 0, 0, 0, 0],
    comments: "",
    jobOffer: "",
    supervisorName: "",
    position: "",
  });

  useEffect(() => {
    const load = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const students = JSON.parse(localStorage.getItem("students")) || [];
      const cName = companySession?.companyName || companySession?.company_name;
      const activeInterns = allApps
        .filter(app => (app.companyId === companyId || app.companyName === cName) && app.finalInternshipStatus === "ACTIVE_INTERN")
        .map(app => ({ ...app, studentFull: students.find(s => s.studentId === app.studentId || s.name === app.studentName) }));
      setInterns(activeInterns);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [companyId, companySession]);

  useEffect(() => {
    const bump = () => setAdvisorEvalNonce((n) => n + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("advisor-evaluation-updated", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("advisor-evaluation-updated", bump);
    };
  }, []);

  const internAdvisorEval = useMemo(() => {
    if (!selectedIntern) return null;
    return getAdvisorEvaluation(selectedIntern.studentId);
  }, [selectedIntern, advisorEvalNonce]);

  // Auto-reminders: which interns have evaluations not yet submitted
  const reminders = useMemo(() => {
    const msgs = [];
    interns.forEach(intern => {
      [1, 2].forEach(m => {
        const rec = getEvaluation(intern.studentId, m);
        if (!rec || rec.status === EVAL_STATUS.NOT_STARTED) msgs.push({ intern, month: m });
      });
    });
    return msgs;
  }, [interns]);

  const loadEvalRecords = (intern) => setEvalRecords({ 1: getEvaluation(intern.studentId, 1), 2: getEvaluation(intern.studentId, 2) });

  const openInternDetail = (intern) => {
    setSelectedIntern(intern);
    setInternDetailTab("logbook");
    setOpenEvalMonth(null);
    setFinalEvalDraftOpen(false);
    const record = ensureWeeklyLogbookForInternship({ studentId: intern.studentId, internshipId: intern.internshipId || intern.id, companyId: intern.companyId || intern.companyName || "", advisorId: intern.advisorName || "" });
    setSelectedRecord(record);
    loadEvalRecords(intern);
    // Load final evaluation
    const finalEval = getFinalEvaluation(intern.studentId);
    setFinalEvalRecord(finalEval);
  };

  const persistCompanySupervisorFields = useCallback((formPayload) => {
    if (!selectedIntern || !selectedRecord) return;
    const weekSlice = formPayload.weeks?.[0];
    if (!weekSlice) return;
    updateWeeklyLogbookMeta({ studentId: selectedIntern.studentId, internshipId: selectedIntern.internshipId || selectedIntern.id, companyId: selectedIntern.companyId || selectedIntern.companyName || "", advisorId: selectedIntern.advisorName || "" }, { supervisorName: formPayload.supervisorName || "" });
    const updated = updateWeekForInternship({ studentId: selectedIntern.studentId, internshipId: selectedIntern.internshipId || selectedIntern.id, companyId: selectedIntern.companyId || selectedIntern.companyName || "", advisorId: selectedIntern.advisorName || "" }, weekSlice.weekNumber, (week) => ({ ...week, days: week.days.map((day, i) => ({ ...day, supervisorComment: weekSlice.days[i]?.supervisorComment ?? day.supervisorComment })) }));
    setSelectedRecord(updated);
  }, [selectedIntern, selectedRecord]);

  const updateCompanyDecision = (weekNumber, action) => {
    if (!selectedIntern) return;
    const updated = updateWeekForInternship({ studentId: selectedIntern.studentId, internshipId: selectedIntern.internshipId || selectedIntern.id, companyId: selectedIntern.companyId || selectedIntern.companyName || "", advisorId: selectedIntern.advisorName || "" }, weekNumber, (week) => {
      if (week.status !== WEEK_STATUS.PENDING_COMPANY) return week;
      return action === "approve" ? { ...week, companyStatus: "APPROVED", status: WEEK_STATUS.PENDING_ADVISOR } : { ...week, companyStatus: "REJECTED", status: WEEK_STATUS.REJECTED_COMPANY };
    });
    setSelectedRecord(updated);
  };

  const handleEvalSubmit = (month, formData) => {
    submitEvaluation({ studentId: selectedIntern.studentId, companyId: companyId || selectedIntern.companyName || "", advisorName: selectedIntern.advisorName || "", month, evaluationData: formData });

    // Notify the student
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: "info",
      title: "Company Monthly Evaluation Submitted",
      message: `Your Month ${month} company monthly evaluation has been filled by ${selectedIntern.companyName || "your company"} and sent to your advisor for review.`,
      date: new Date().toISOString(),
      studentId: selectedIntern.studentId,
      studentName: selectedIntern.studentName,
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));

    window.dispatchEvent(new Event("storage"));
    loadEvalRecords(selectedIntern);
    setOpenEvalMonth(null);
  };

  const handleFinalEvalSubmit = (payload) => {
    const { total, finalMark, ...formOnly } = payload;
    const record = submitFinalEvaluation({
      studentId: selectedIntern.studentId,
      studentName: selectedIntern.studentName,
      companyName: selectedIntern.companyName,
      formData: formOnly,
      total,
      finalMark,
    });

    // Update local state
    setFinalEvalRecord(record);

    // Notify the student
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.push({
      id: Date.now(),
      type: "info",
      title: "Company Final Evaluation Submitted",
      message: `Your company final evaluation has been filled by ${selectedIntern.companyName || "your company"} and sent to your advisor for approval.`,
      date: new Date().toISOString(),
      studentId: selectedIntern.studentId,
      studentName: selectedIntern.studentName,
      read: false,
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));

    window.dispatchEvent(new Event("storage"));
    setFinalEvalDraftOpen(false);
  };

  const evalStatusBadge = (status) => ({
    [EVAL_STATUS.NOT_STARTED]: "bg-gray-100 text-gray-600 border-gray-200",
    [EVAL_STATUS.PENDING]:     "bg-yellow-100 text-yellow-700 border-yellow-200",
    [EVAL_STATUS.SUBMITTED]:   "bg-indigo-100 text-indigo-700 border-indigo-200",
    [EVAL_STATUS.APPROVED]:    "bg-green-100 text-green-700 border-green-200",
    [EVAL_STATUS.REJECTED]:    "bg-red-100 text-red-700 border-red-200",
  }[status] || "bg-gray-100 text-gray-600 border-gray-200");

  const groupedInterns = interns.reduce((acc, intern) => {
    const title = intern.internshipTitle || "General Internship";
    if (!acc[title]) acc[title] = [];
    acc[title].push(intern);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Auto reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map(({ intern, month }) => (
            <div key={`${intern.studentId}-m${month}`} className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span><strong>Reminder:</strong> Month {month} company monthly evaluation for <strong>{intern.studentName}</strong> is due. Please fill it in.</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Your Active Interns</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Active Program Members: {interns.length}</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-100">University Verified</div>
      </div>

      {Object.keys(groupedInterns).length === 0 ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-gray-200" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Internships Yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">When student placements are finalized by university coordinators, they will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {Object.entries(groupedInterns).map(([title, studentList]) => (
            <div key={title} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-600 w-fit">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">{title}</h3>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">{studentList.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentList.map(intern => {
                  const hasPendingEval = [1, 2].some(m => { const rec = getEvaluation(intern.studentId, m); return !rec || rec.status === EVAL_STATUS.NOT_STARTED; });
                  return (
                    <button type="button" onClick={() => openInternDetail(intern)} key={intern.id} className="app-card group relative border-l-4 border-l-indigo-600 p-6 text-left transition-shadow hover:shadow-md">
                      {hasPendingEval && <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white" title="Evaluation due" />}
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-xl font-black capitalize text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          {intern.studentName?.[0] || "S"}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg leading-tight">{intern.studentName}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Student ID: {intern.studentId}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><Mail className="w-3.5 h-3.5 text-indigo-600" /><span className="truncate max-w-[120px]">{intern.studentFull?.email || "Academic Account"}</span></div>
                        <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />Active</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Intern detail modal ── */}
      {selectedIntern && (
        <div className="fixed inset-0 bg-black/60 z-[160] p-4 overflow-y-auto">
          <div className="app-modal-panel max-w-5xl mx-auto my-8 p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedIntern.studentName}</h3>
                <p className="text-sm text-gray-500">{selectedIntern.internshipTitle || "General Internship"} · {selectedIntern.companyName}</p>
              </div>
              <button type="button" onClick={() => { setSelectedIntern(null); setSelectedRecord(null); setOpenEvalMonth(null); setFinalEvalDraftOpen(false); }} className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Close</button>
            </div>

            {/* Inner tabs */}
            <div className="flex flex-wrap gap-1 app-tab-shell mb-6">
              <button type="button" onClick={() => { setInternDetailTab("logbook"); setOpenEvalMonth(null); }} className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${internDetailTab === "logbook" ? "app-tab-active" : "app-tab-inactive"}`}>
                <FileText className="w-4 h-4" /> Weekly Logbook
              </button>
              <button type="button" onClick={() => { setInternDetailTab("monthly"); setOpenEvalMonth(null); }} className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${internDetailTab === "monthly" ? "app-tab-active" : "app-tab-inactive"}`}>
                <ClipboardList className="w-4 h-4" /> Company Monthly Evaluation
              </button>
              <button type="button" onClick={() => { setInternDetailTab("final"); setOpenEvalMonth(null); }} className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${internDetailTab === "final" ? "app-tab-active" : "app-tab-inactive"}`}>
                <ClipboardList className="w-4 h-4" /> Company Final Evaluation
              </button>
              <button type="button" onClick={() => { setInternDetailTab("advisor-eval"); setOpenEvalMonth(null); setFinalEvalDraftOpen(false); }} className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${internDetailTab === "advisor-eval" ? "app-tab-active" : "app-tab-inactive"}`}>
                <GraduationCap className="w-4 h-4" /> Advisor evaluation
                {internAdvisorEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED && (
                  <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Submitted by advisor" />
                )}
              </button>
            </div>

            {/* Weekly Logbook tab */}
            {internDetailTab === "logbook" && selectedRecord && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecord.weeks.map(week => (
                  <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-black text-gray-900">Week {week.weekNumber}</p>
                      <span className="px-2.5 py-1 rounded-full border text-[10px] font-black uppercase bg-gray-100 text-gray-700 border-gray-200">{STATUS_LABELS[week.status]}</span>
                    </div>
                    <InternshipLogbookForm
                      key={`${selectedIntern.studentId}-w${week.weekNumber}-${week.status}`}
                      role="company"
                      readOnly={week.status !== WEEK_STATUS.PENDING_COMPANY}
                      title={`Week ${week.weekNumber}`}
                      initialData={{ studentName: selectedRecord.meta?.studentName || selectedIntern.studentName || "", companyName: selectedRecord.meta?.companyName || selectedIntern.companyName || "", supervisorName: selectedRecord.meta?.supervisorName || "", safetyBrief: selectedRecord.meta?.safetyBrief || "", weeks: [week] }}
                      onValuesChange={persistCompanySupervisorFields}
                    />
                    <div className="text-[11px] font-semibold text-gray-600">Company: {week.companyStatus} | Advisor: {week.advisorStatus}</div>
                    {week.status === WEEK_STATUS.PENDING_COMPANY ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateCompanyDecision(week.weekNumber, "approve")} className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold">Approve</button>
                        <button type="button" onClick={() => updateCompanyDecision(week.weekNumber, "reject")} className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold">Reject</button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 font-semibold">No company action available for this status.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Company Monthly Evaluation tab */}
            {internDetailTab === "monthly" && (
              <div>
                {openEvalMonth === null ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2].map(month => {
                      const rec = evalRecords[month];
                      const status = rec?.status || EVAL_STATUS.NOT_STARTED;
                      const canEdit = status === EVAL_STATUS.NOT_STARTED || status === EVAL_STATUS.REJECTED;
                      return (
                        <div key={month} className="border border-gray-200 rounded-xl p-6 space-y-4 bg-gray-50/40">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-900 text-base">Month {month} — Company monthly evaluation</h4>
                            <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${evalStatusBadge(status)}`}>{EVAL_STATUS_LABELS[status]}</span>
                          </div>

                          {rec?.evaluationData && (
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Total: <strong>{rec.evaluationData.totalMarks ?? "—"}</strong> / 100</p>
                              <p>Performance: <strong>{rec.evaluationData.monthlyPerformance ?? "—"}</strong> / 20</p>
                              {rec.advisorComment && <p className="text-indigo-700 text-xs mt-1">Advisor: {rec.advisorComment}</p>}
                            </div>
                          )}
                          <button type="button" onClick={() => setOpenEvalMonth(month)}
                            className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${canEdit ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                            {canEdit ? "Fill Evaluation" : "View Evaluation"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <button type="button" onClick={() => setOpenEvalMonth(null)} className="mb-4 text-sm text-indigo-600 hover:underline font-semibold">← Back to evaluations</button>
                    {(() => {
                      const rec = evalRecords[openEvalMonth];
                      const status = rec?.status || EVAL_STATUS.NOT_STARTED;
                      const isReadOnly = status === EVAL_STATUS.SUBMITTED || status === EVAL_STATUS.APPROVED;
                      const prefill = rec?.evaluationData || { studentName: selectedIntern.studentName || "", studentId: selectedIntern.studentId || "", department: selectedIntern.department || "", companyName: selectedIntern.companyName || "", month: openEvalMonth === 1 ? "Month 1" : "Month 2" };
                      return (
                        <InternshipMonthlyEvaluation
                          key={`${selectedIntern.studentId}-m${openEvalMonth}-${status}`}
                          initialData={prefill}
                          readOnly={isReadOnly}
                          existingAdvisorComment={rec?.advisorComment || ""}
                          onSubmit={isReadOnly ? undefined : (data) => handleEvalSubmit(openEvalMonth, data)}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Company Final Evaluation tab */}
            {internDetailTab === "final" && selectedIntern && (() => {
              const finalStatus = finalEvalRecord?.status ?? FINAL_EVAL_STATUS.NOT_STARTED;
              const showFinalCta =
                finalStatus === FINAL_EVAL_STATUS.NOT_STARTED && !finalEvalDraftOpen;
              const showFinalForm = !showFinalCta;

              const mergedFinalFormInitial = {
                ...emptyFinalFormData(),
                ...(finalEvalRecord?.formData || {}),
                studentName: selectedIntern.studentName,
                idNo: selectedIntern.studentId,
                department: selectedIntern.department || selectedIntern.studentFull?.department || "",
                organization: selectedIntern.companyName || "",
              };

              const startFinalDraft = () => {
                setFinalEvalRecord((prev) => ({
                  ...(prev || {}),
                  status: FINAL_EVAL_STATUS.NOT_STARTED,
                  formData: { ...emptyFinalFormData(), ...(prev?.formData || {}) },
                }));
                setFinalEvalDraftOpen(true);
              };

              const finalBadgeClass =
                finalStatus === FINAL_EVAL_STATUS.NOT_STARTED ? "bg-gray-100 text-gray-600 border-gray-200" :
                finalStatus === FINAL_EVAL_STATUS.PENDING_ADVISOR_APPROVAL ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                finalStatus === FINAL_EVAL_STATUS.APPROVED_BY_ADVISOR ? "bg-green-100 text-green-700 border-green-200" :
                finalStatus === FINAL_EVAL_STATUS.PENDING_EXAMINER_APPROVAL ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                finalStatus === FINAL_EVAL_STATUS.FINAL_APPROVED ? "bg-green-100 text-green-700 border-green-200" :
                "bg-red-100 text-red-700 border-red-200";

              return (
                <div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Company Final Evaluation</h3>
                      <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${finalBadgeClass}`}>
                        {FINAL_EVAL_STATUS_LABELS[finalStatus]}
                      </span>
                    </div>

                    {showFinalCta && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Company final evaluation not started yet.</p>
                        <button
                          type="button"
                          onClick={startFinalDraft}
                          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
                        >
                          Start Company Final Evaluation
                        </button>
                      </div>
                    )}

                    {showFinalForm && finalEvalRecord && (
                      <>
                        {finalEvalRecord.total !== undefined && finalStatus !== FINAL_EVAL_STATUS.NOT_STARTED && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-600 mb-1">Total Score</p>
                                <p className="text-2xl font-bold text-indigo-700">{finalEvalRecord.total} / 60</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-600 mb-1">Final Mark</p>
                                <p className="text-2xl font-bold text-green-700">{finalEvalRecord.finalMark} / 20</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <InternshipEvaluationForm
                          key={`final-${selectedIntern.studentId}-${finalStatus}-${finalEvalDraftOpen ? "draft" : "saved"}`}
                          initialData={mergedFinalFormInitial}
                          readOnly={finalStatus !== FINAL_EVAL_STATUS.NOT_STARTED && finalStatus !== FINAL_EVAL_STATUS.REJECTED}
                          advisorComment={finalEvalRecord.advisorComment || ""}
                          examinerComment={finalEvalRecord.examinerComment || ""}
                          onSubmit={
                            (finalStatus === FINAL_EVAL_STATUS.NOT_STARTED || finalStatus === FINAL_EVAL_STATUS.REJECTED)
                              ? handleFinalEvalSubmit
                              : undefined
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {internDetailTab === "advisor-eval" && selectedIntern && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The university academic advisor&apos;s evaluation for this intern (read only).
                </p>
                {!internAdvisorEval ||
                internAdvisorEval.status !== ADVISOR_EVAL_STATUS.SUBMITTED ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
                    The academic advisor has not submitted their evaluation for this student yet.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(internAdvisorEval.submittedAt).toLocaleString()}
                      {internAdvisorEval.advisorName && (
                        <span className="block mt-1 font-semibold text-gray-800">
                          Advisor: {internAdvisorEval.advisorName}
                        </span>
                      )}
                    </p>
                    <AdvisorStudentEvaluationForm
                      readOnly
                      initialData={{
                        ...(internAdvisorEval.formData || {}),
                        studentName: selectedIntern.studentName || "",
                        idNo: selectedIntern.studentId || "",
                        department: selectedIntern.department || "",
                        organization: selectedIntern.companyName || "",
                        supervisorName:
                          internAdvisorEval.formData?.supervisorName ||
                          internAdvisorEval.advisorName ||
                          internAdvisorEval.formData?.advisorName ||
                          "",
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CompanyDashboard (root) ──────────────────────────────────────────────────
const CompanyDashboard = () => {
  const [session, setSession] = useState({});
  const [view, setView] = useState("home");
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const currentSession = getValidCompanySession();
    if (!currentSession || Object.keys(currentSession).length === 0) navigate("/login");
    else setSession(currentSession);
  }, [navigate]);

  const handleLogout = () => {
    try { logout(); } catch { /* ignore */ }
    navigate("/login");
  };

  const cName   = session.companyName || session.company_name || "Company";
  const email   = session.contactEmail || session.representative_email || session.email || "N/A";
  const repName = session.representative_name || session.fullName || "Representative";

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
            <div className="flex min-w-0 max-w-[200px] items-center gap-2 rounded-lg border border-transparent px-2 py-2 sm:max-w-none sm:px-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {cName.charAt(0)}
              </div>
              <span className="truncate text-sm font-medium text-slate-700">{cName}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <CompanySidebar currentView={view} onNavigate={setView} companyName={cName} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="app-hero mb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">Welcome, {cName}</h1>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Email:</span>
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                      <span className="font-bold">Representative:</span>
                      <span>{repName}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Role</p>
                  <p className="text-sm font-bold">Company Partner</p>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-7xl">
              {view === "home" && (
                <div className="grid animate-fade-in grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="app-card p-12 text-center md:col-span-2">
                    <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                    <h3 className="mb-2 text-xl font-bold text-gray-900">Welcome to your dashboard</h3>
                    <p className="mx-auto max-w-sm text-gray-500">
                      Track student applications and manage your company postings from the menu on the left.
                    </p>
                  </div>
                  <div className="app-card p-8">
                    <h4 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                      <Clock className="h-4 w-4 text-indigo-600" /> System reminders
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                        <p className="text-gray-600">Ensure all active internships have correct contact info.</p>
                      </li>
                      <li className="flex gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                        <p className="text-gray-600">Review new student applications daily for fast onboarding.</p>
                      </li>
                      <li className="flex gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <p className="text-gray-600">Company monthly evaluations are due at 30 and 60 days — check Active interns.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {view === "internships" && <InternshipPage companySession={session} />}
              {view === "applications" && <AppliedStudentsPage companySession={session} />}
              {view === "interns" && <InternsPage companySession={session} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
