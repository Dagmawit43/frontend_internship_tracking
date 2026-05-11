import React, { useState, useEffect, useCallback } from "react";
import { Bell, LogOut, ChevronDown, Plus, Edit2, Trash2, ChevronUp, MapPin, Building2, Briefcase, GraduationCap, Clock, Layers, User, Mail, CheckCircle, XCircle, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import { DEPARTMENTS } from "../constants/departments";
import InternshipAcceptanceForm from "./InternshipAcceptanceForm";
import InternshipLogbookForm from "./InternshipLogbookForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  ensureWeeklyLogbookForInternship,
  updateWeekForInternship,
  updateWeeklyLogbookMeta,
} from "../utils/weeklyLogbook";

const getValidCompanySession = () => {
  try {
    const candidates = ["company", "user"];
    for (const key of candidates) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === "null" || raw === "undefined") continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        if (
          parsed.companyName || parsed.company_name ||
          parsed.contactEmail || parsed.representative_email ||
          parsed.role === "Company"
        ) {
          return parsed;
        }
      } catch { continue; }
    }
    return {};
  } catch (e) {
    return {};
  }
};

const InternshipModal = ({ isOpen, onClose, onSubmit, initialData, companySession }) => {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    required_skills: "",
    company_name: "",
    location: "",
    internship_type: "Onsite",
    start_date: "",
    end_date: "",
    total_hours: "",
    days_in_week: "",
    number_interns: "",
    status: "PENDING",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        required_skills: Array.isArray(initialData.required_skills) 
          ? initialData.required_skills.join(", ") 
          : initialData.required_skills
      });
    } else {
      setFormData({
        title: "",
        department: "",
        description: "",
        required_skills: "",
        company_name: companySession?.companyName || companySession?.company_name || "",
        location: "",
        internship_type: "Onsite",
        start_date: "",
        end_date: "",
        total_hours: "",
        days_in_week: "",
        number_interns: "",
        status: "PENDING",
      });
    }
  }, [initialData, isOpen, companySession]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.required_skills
      .split(",")
      .map(s => s.trim())
      .filter(s => s);
      
    onSubmit({
      ...formData,
      required_skills: skillsArray,
      id: initialData ? initialData.id : Date.now().toString(),
      company_id: companySession?.id || companySession?.company_id || "mock-company-id"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 scrollbar-hide">
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
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Software Engineering Intern" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Department</label>
              <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Addis Ababa or Remote" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internship Type</label>
              <select required value={formData.internship_type} onChange={e => setFormData({...formData, internship_type: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Describe the internship roles..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (Comma separated)</label>
            <input required type="text" value={formData.required_skills} onChange={e => setFormData({...formData, required_skills: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="React, Node.js, Python" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <input required type="number" min="1" value={formData.total_hours} onChange={e => setFormData({...formData, total_hours: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="160" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days / Week</label>
              <input required type="number" min="1" max="7" value={formData.days_in_week} onChange={e => setFormData({...formData, days_in_week: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interns Needed</label>
              <input required type="number" min="1" value={formData.number_interns} onChange={e => setFormData({...formData, number_interns: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
              {initialData ? "Save Changes" : "Post Internship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InternshipCard = ({ data, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CLOSED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden mb-4">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(data.status)}`}>
                {data.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600">
               <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> <span className="font-semibold text-gray-800">Company:</span> {data.company_name}</div>
               <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-purple-600" /> <span className="font-semibold text-gray-800">Department:</span> {data.department}</div>
               <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600" /> <span className="font-semibold text-gray-800">Location:</span> {data.location}</div>
               <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-600" /> <span className="font-semibold text-gray-800">Type:</span> {data.internship_type}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => onEdit(data)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(data.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
           <div className="flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /> <span>{data.start_date} to {data.end_date}</span></div>
             <div className="flex items-center gap-2 text-gray-600"><GraduationCap className="w-4 h-4" /> <span>{data.number_interns} Interns Needed</span></div>
           </div>
           <button 
             onClick={() => setExpanded(!expanded)}
             className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
           >
             {expanded ? <><ChevronUp className="w-4 h-4"/> Hide Details</> : <><ChevronDown className="w-4 h-4"/> View Details</>}
           </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 bg-gray-50 border-t border-gray-100 animate-fade-in">
           <div className="space-y-4">
              <div>
                 <h4 className="text-sm font-bold text-gray-900 mb-1">Description</h4>
                 <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
              </div>
              <div>
                 <h4 className="text-sm font-bold text-gray-900 mb-1">Required Skills</h4>
                 <div className="flex flex-wrap gap-2">
                    {data.required_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
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

const AppliedStudentsPage = ({ companySession }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const cName = companySession?.companyName || companySession?.company_name || "";

  useEffect(() => {
    const loadApplications = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      // Filter by company name (since ID matching might be flaky in mock environments)
      const filtered = allApps.filter(app => 
        app.companyName === cName || 
        app.companyId === companySession?.id || 
        app.companyId === companySession?.company_id
      );
      setApplications(filtered.sort((a,b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
    };

    loadApplications();
    // Refresh if other tabs update
    window.addEventListener("storage", loadApplications);
    return () => window.removeEventListener("storage", loadApplications);
  }, [cName, companySession]);

  const handleUpdateStatus = (appId, acceptanceFormData) => {
    const newStatus = acceptanceFormData.accepted ? "accepted" : acceptanceFormData.rejected ? "rejected" : "Pending";
    const allApps = JSON.parse(localStorage.getItem("applications")) || [];
    const updated = allApps.map(app => 
      app.id === appId
        ? {
            ...app,
            acceptanceForm: acceptanceFormData,
            status: newStatus,
            applicationStatus: acceptanceFormData.accepted ? "COMPANY_ACCEPTED" : "COMPANY_REJECTED",
            updatedAt: new Date().toISOString(),
          }
        : app
    );
    localStorage.setItem("applications", JSON.stringify(updated));
    setApplications(updated.filter(app => 
      app.companyName === cName || 
      app.companyId === companySession?.id || 
      app.companyId === companySession?.company_id
    ));

    // Update notification for student
    const targetApp = updated.find(a => a.id === appId);
    if (targetApp) {
      const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
      notifications.push({
        id: Date.now(),
        type: newStatus === "accepted" ? "success" : "error",
        title: `Application Status Updated`,
        message: `${cName} has marked your application for ${targetApp.internshipTitle || 'the internship'} as ${newStatus}.`,
        date: new Date().toISOString(),
        studentId: targetApp.studentId,
        studentName: targetApp.studentName,
        read: false
      });
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
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <User className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No applications yet</h3>
          <p className="text-gray-500">Student applications for your posted jobs will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="bg-blue-50 h-16 w-16 rounded-xl flex items-center justify-center border border-blue-100 flex-shrink-0">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight">{app.studentName}</h4>
                    <p className="text-sm text-blue-600 font-semibold mb-1 italic">Applying for: {app.internshipTitle || "General Internship"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                       <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {app.studentId || "N/A"}</span>
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 self-center sm:self-start">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                     app.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                     app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                     'bg-yellow-100 text-yellow-700 border-yellow-200'
                   }`}>
                     {app.status}
                   </span>
                   {app.status === 'Pending' || app.status === 'applied' ? (
                     <div className="flex gap-2">
                       <button 
                         onClick={() => setSelectedApplication(app)}
                         className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                       >
                         <FileText className="w-4 h-4" /> Open Acceptance Form
                       </button>
                     </div>
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
                    <div className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{app.documentName || "Student_CV.pdf"}</p>
                        <p className="text-[10px] text-gray-500">Uploaded Resume/CV</p>
                      </div>
                      <a 
                        href={app.additionalDocument} 
                        download={app.documentName || "CV.pdf"}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded hover:bg-blue-100 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {app.acceptanceForm && (
                <div className="mt-4 p-3 border border-blue-100 rounded-lg bg-blue-50 text-sm text-blue-700">
                  Acceptance form submitted by company:{" "}
                  <span className="font-bold">
                    {app.acceptanceForm.accepted ? "Accepted" : app.acceptanceForm.rejected ? "Rejected" : "Pending"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 z-[150] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Acceptance Form - {selectedApplication.studentName}
              </h3>
              <button onClick={() => setSelectedApplication(null)} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <InternshipAcceptanceForm
              initialData={selectedApplication.acceptanceForm}
              onSubmit={(formData) => {
                handleUpdateStatus(selectedApplication.id, formData);
                setSelectedApplication(null);
              }}
              readOnly={selectedApplication.status !== "Pending" && selectedApplication.status !== "applied"}
              showActions
            />
          </div>
        </div>
      )}
    </div>
  );
};

const InternshipPage = ({ companySession }) => {
  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem("allInternships");
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        title: "Software Engineer Intern",
        department: "Software Engineering",
        description: "Join our team to work on real-world projects. You will gain experience in full-stack development using React and Node.js.",
        required_skills: ["React", "JavaScript", "CSS"],
        company_name: companySession?.companyName || "AASTU Labs",
        location: "Addis Ababa",
        internship_type: "Onsite",
        start_date: "2026-06-01",
        end_date: "2026-09-01",
        total_hours: "160",
        days_in_week: "5",
        number_interns: "3",
        status: "ACTIVE"
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);

  useEffect(() => {
    localStorage.setItem("allInternships", JSON.stringify(internships));
  }, [internships]);

  const handleCreateNew = () => {
    setEditingInternship(null);
    setIsModalOpen(true);
  };

  const handleEdit = (data) => {
    setEditingInternship(data);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this internship?")) {
      setInternships(internships.filter(i => i.id !== id));
    }
  };

  const handleSubmit = (data) => {
    if (editingInternship) {
      setInternships(internships.map(i => i.id === data.id ? data : i));
    } else {
      setInternships([data, ...internships]);
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internships</h2>
          <p className="text-sm text-gray-500">Post and manage your internship opportunities</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Internship
        </button>
      </div>

      {internships.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No internships posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {internships.map(internship => (
            <InternshipCard 
              key={internship.id} 
              data={internship} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <InternshipModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={editingInternship}
        companySession={companySession}
      />
    </div>
  );
};

const CompanyDashboard = () => {
  const [session, setSession] = useState({});
  const [view, setView] = useState("home");
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    const currentSession = getValidCompanySession();
    if (!currentSession || Object.keys(currentSession).length === 0) {
      navigate("/login");
    } else {
      setSession(currentSession);
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      logout();
    } catch (e) {
      // ignore
    }
    navigate("/login");
  };
const InternsPage = ({ companySession }) => {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const companyId = companySession?.id || companySession?.company_id;

  useEffect(() => {
    const loadInterns = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const students = JSON.parse(localStorage.getItem("students")) || [];
      const cName = companySession?.companyName || companySession?.company_name;
      
      const activeInterns = allApps.filter(app => 
        (app.companyId === companyId || app.companyName === cName) &&
        app.finalInternshipStatus === "ACTIVE_INTERN"
      ).map(app => {
        const student = students.find(s => s.studentId === app.studentId || s.name === app.studentName);
        return { ...app, studentFull: student };
      });
      
      setInterns(activeInterns);
    };

    loadInterns();
    window.addEventListener("storage", loadInterns);
    return () => window.removeEventListener("storage", loadInterns);
  }, [companyId, companySession]);

  const loadStudentLogbook = (intern) => {
    const record = ensureWeeklyLogbookForInternship({
      studentId: intern.studentId,
      internshipId: intern.internshipId || intern.id,
      companyId: intern.companyId || intern.companyName || "",
      advisorId: intern.advisorName || "",
    });
    setSelectedRecord(record);
  };

  const openInternDetail = (intern) => {
    setSelectedIntern(intern);
    loadStudentLogbook(intern);
  };

  const persistCompanySupervisorFields = useCallback((formPayload) => {
    if (!selectedIntern || !selectedRecord) return;
    const weekSlice = formPayload.weeks?.[0];
    if (!weekSlice) return;

    updateWeeklyLogbookMeta(
      {
        studentId: selectedIntern.studentId,
        internshipId: selectedIntern.internshipId || selectedIntern.id,
        companyId: selectedIntern.companyId || selectedIntern.companyName || "",
        advisorId: selectedIntern.advisorName || "",
      },
      { supervisorName: formPayload.supervisorName || "" }
    );

    const updated = updateWeekForInternship(
      {
        studentId: selectedIntern.studentId,
        internshipId: selectedIntern.internshipId || selectedIntern.id,
        companyId: selectedIntern.companyId || selectedIntern.companyName || "",
        advisorId: selectedIntern.advisorName || "",
      },
      weekSlice.weekNumber,
      (week) => ({
        ...week,
        days: week.days.map((day, i) => ({
          ...day,
          supervisorComment: weekSlice.days[i]?.supervisorComment ?? day.supervisorComment,
        })),
      })
    );
    setSelectedRecord(updated);
  }, [selectedIntern, selectedRecord]);

  const updateCompanyDecision = (weekNumber, action) => {
    if (!selectedIntern) return;
    const updated = updateWeekForInternship(
      {
        studentId: selectedIntern.studentId,
        internshipId: selectedIntern.internshipId || selectedIntern.id,
        companyId: selectedIntern.companyId || selectedIntern.companyName || "",
        advisorId: selectedIntern.advisorName || "",
      },
      weekNumber,
      (week) => {
        if (week.status !== WEEK_STATUS.PENDING_COMPANY) return week;
        if (action === "approve") {
          return {
            ...week,
            companyStatus: "APPROVED",
            status: WEEK_STATUS.PENDING_ADVISOR,
          };
        }
        return {
          ...week,
          companyStatus: "REJECTED",
          status: WEEK_STATUS.REJECTED_COMPANY,
        };
      }
    );
    setSelectedRecord(updated);
  };

  // Group interns by internshipTitle
  const groupedInterns = interns.reduce((acc, intern) => {
    const title = intern.internshipTitle || "General Internship";
    if (!acc[title]) acc[title] = [];
    acc[title].push(intern);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div>
             <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Your Active Interns</h2>
             <p className="text-sm text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Active Program Members: {interns.length}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100">
             University Verified
          </div>
       </div>

       {Object.keys(groupedInterns).length === 0 ? (
         <div className="bg-white p-16 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Users className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Internships Yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
              When student placements are finalized by university coordinators, they will appear here automatically.
            </p>
         </div>
       ) : (
         <div className="grid grid-cols-1 gap-10">
            {Object.entries(groupedInterns).map(([title, studentList]) => (
              <div key={title} className="space-y-4">
                 <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-600 w-fit">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">{title}</h3>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">{studentList.length}</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studentList.map(intern => (
                     <button
                       type="button"
                       onClick={() => openInternDetail(intern)}
                       key={intern.id}
                       className="text-left bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all border-l-4 border-l-blue-600 group"
                     >
                         <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors capitalize">
                               {intern.studentName?.[0] || 'S'}
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900 text-lg leading-tight">{intern.studentName}</h4>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Student ID: {intern.studentId}</p>
                            </div>
                         </div>
                         <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                               <Mail className="w-3.5 h-3.5 text-blue-600" />
                               <span className="truncate max-w-[120px]">{intern.studentFull?.email || "Academic Account"}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1">
                               <div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></div>
                               Active
                            </span>
                         </div>
                     </button>
                    ))}
                 </div>
              </div>
            ))}
         </div>
       )}

      {selectedIntern && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 z-[160] p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedIntern.studentName} - Weekly Logbook</h3>
                <p className="text-sm text-gray-500">Internship: {selectedIntern.internshipTitle || "General Internship"}</p>
              </div>
              <button onClick={() => { setSelectedIntern(null); setSelectedRecord(null); }} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRecord.weeks.map((week) => (
                <div key={week.weekNumber} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <p className="font-black text-gray-900">Week {week.weekNumber}</p>
                    <span className="px-2.5 py-1 rounded-full border text-[10px] font-black uppercase bg-gray-100 text-gray-700 border-gray-200">
                      {STATUS_LABELS[week.status]}
                    </span>
                  </div>

                  <InternshipLogbookForm
                    key={`${selectedIntern.studentId}-w${week.weekNumber}-${week.status}`}
                    role="company"
                    readOnly={week.status !== WEEK_STATUS.PENDING_COMPANY}
                    title={`Week ${week.weekNumber}`}
                    initialData={{
                      studentName: selectedRecord.meta?.studentName || selectedIntern.studentName || "",
                      companyName: selectedRecord.meta?.companyName || selectedIntern.companyName || "",
                      supervisorName: selectedRecord.meta?.supervisorName || "",
                      safetyBrief: selectedRecord.meta?.safetyBrief || "",
                      weeks: [week],
                    }}
                    onValuesChange={persistCompanySupervisorFields}
                  />

                  <div className="text-[11px] font-semibold text-gray-600">
                    Company: {week.companyStatus} | Advisor: {week.advisorStatus}
                  </div>

                  {week.status === WEEK_STATUS.PENDING_COMPANY ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCompanyDecision(week.weekNumber, "approve")}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateCompanyDecision(week.weekNumber, "reject")}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 font-semibold">No company action available for this status.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const cName = session.companyName || session.company_name || "Company";
  const email = session.contactEmail || session.representative_email || session.email || "N/A";
  const repName = session.representative_name || session.fullName || "Representative";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
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
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Logout
              </button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent">
                <div className="bg-blue-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                  {cName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{cName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">Welcome, {cName}</h1>
              <div className="flex flex-wrap gap-4 text-sm opacity-90 mt-2">
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

            <div className="bg-white/10 px-4 py-3 rounded-lg border border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">Role</p>
              <p className="text-sm font-bold">Company Partner</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
           <button 
             className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${view === 'home' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             onClick={() => setView("home")}
           >
             Overview
           </button>
           <button 
             className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${view === 'internships' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             onClick={() => setView("internships")}
           >
             Internships
           </button>
            <button 
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${view === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView("applications")}
            >
              Applied Students
            </button>
            <button 
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${view === 'interns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView("interns")}
            >
              Active Interns
            </button>
         </div>

        {/* Dynamic Content */}
        <div>
          {view === "home" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
               <div className="md:col-span-2 bg-white p-12 rounded-xl shadow-md border border-gray-200 text-center">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your dashboard</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Track student applications and manage your company postings from the tabs above.</p>
               </div>
               <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> System Reminders</h4>
                  <ul className="space-y-4">
                     <li className="flex gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                        <p className="text-gray-600">Ensure all active internships have correct contact info.</p>
                     </li>
                     <li className="flex gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                        <p className="text-gray-600">Review new student applications daily for fast onboarding.</p>
                     </li>
                  </ul>
               </div>
            </div>
          ) : view === "internships" ? (
            <InternshipPage companySession={session} />
          ) : view === "applications" ? (
            <AppliedStudentsPage companySession={session} />
          ) : view === "interns" ? (
            <InternsPage companySession={session} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
