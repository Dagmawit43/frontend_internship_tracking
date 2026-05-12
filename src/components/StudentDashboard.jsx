import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getInternships } from "../mock/internshipApi";
import { Bell, LogOut, ChevronDown, CheckCircle, Clock, XCircle, AlertCircle, Upload, FileText, MapPin, Building2, User, Mail, Phone, Loader2, Eye, Layers, Briefcase, ChevronUp, Globe } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import ApplicationModal from "./modals/ApplicationModal";
import companiesMock from "../mock/companies.json";
import InternshipAcceptanceForm, { ACCEPTANCE_FORM_DEFAULTS } from "./InternshipAcceptanceForm";
import InternshipLogbookForm from "./InternshipLogbookForm";
import {
  WEEK_STATUS,
  STATUS_LABELS,
  canStudentEditWeek,
  ensureWeeklyLogbookForInternship,
  updateWeekForInternship,
  updateWeeklyLogbookMeta,
} from "../utils/weeklyLogbook";
import {
  getDocumentsByStudentId,
  submitInternshipDocument,
  getStudentDocumentSummary,
  ROLE_DOC_STATUS,
} from "../utils/internshipDocuments";
import {
  getAdvisorEvaluation,
  ADVISOR_EVAL_STATUS,
} from "../utils/advisorEvaluations";
import AdvisorStudentEvaluationForm from "./AdvisorStudentEvaluationForm";

// Top navigation (inlined)
const TopNavigation = ({ studentName, notificationCount = 0 }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
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
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Logout
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {studentName || "Student"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-1 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{studentName || "Student"}</p>
                      <p className="text-xs text-gray-500">Student Account</p>
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

// Welcome header (inlined)
const WelcomeHeader = ({ studentName, department, college, internshipStatus, advisor, examiner, examiner2 }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      "Not Applied": {
        icon: AlertCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300",
      },
      Pending: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
      },
      Active: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
      },
      Completed: {
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
      },
    };
    return statusMap[status] || statusMap["Not Applied"];
  };

  const statusConfig = getStatusConfig(internshipStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
      <div className="flex flex-col gap-6">
        {/* Top Row: Name and Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {studentName || "Student"}</h1>
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              {department && (
                <div className="flex items-center gap-2">
                  <span className="opacity-90">Department:</span>
                  <span className="font-semibold">{department}</span>
                </div>
              )}
              {college && (
                <div className="flex items-center gap-2">
                  <span className="opacity-90">College:</span>
                  <span className="font-semibold">{college}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}
          >
            <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
            <div>
              <p className={`text-xs font-medium ${statusConfig.color} opacity-70`}>Internship Status</p>
              <p className={`text-sm font-bold ${statusConfig.color}`}>{internshipStatus || "Not Applied"}</p>
            </div>
          </div>
        </div>

        {/* Assignment Information Row */}
        {(advisor || examiner || examiner2) && (
          <div className="border-t border-blue-500/30 pt-4">
            <h3 className="text-sm font-semibold mb-3 opacity-90">Assigned Supervisors</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {advisor && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="opacity-90">Advisor:</span>
                  <span className="font-semibold">{advisor}</span>
                </div>
              )}
              {examiner && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="opacity-90">Examiner 1:</span>
                  <span className="font-semibold">{examiner}</span>
                </div>
              )}
              {examiner2 && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="opacity-90">Examiner 2:</span>
                  <span className="font-semibold">{examiner2}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const buildInitialAcceptanceForm = ({ student, internship, applicationData }) => ({
  ...ACCEPTANCE_FORM_DEFAULTS,
  internName: student?.name || "",
  idNo: student?.studentId || "",
  college: student?.college || "Addis Ababa Science and Technology University",
  department: student?.department || "",
  mobile: student?.phone || "",
  startDate: internship?.start_date || "",
  endDate: internship?.end_date || "",
  workingDays: internship?.days_in_week || "",
  workingHours: internship?.total_hours || "",
  orgName: applicationData?.companyName || internship?.company_name || "",
});

const AvailableInternships = ({ studentId, studentDepartment, studentProfile, onApplicationSubmit }) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    loadInternships();
  }, [studentDepartment]);

  const loadInternships = async () => {
    try {
      const localInternships = JSON.parse(localStorage.getItem("allInternships")) || null;
      
      let data = [];
      if (localInternships) {
        data = localInternships;
      } else {
        data = await getInternships();
      }

      const localCompanies = JSON.parse(localStorage.getItem("companies")) || [];
      const allCompanies = [...localCompanies, ...companiesMock];

      const processed = data
        .map(internship => {
          const comp = allCompanies.find(c => c.company_id === internship.company_id || c.id === internship.company_id || c.company_name === internship.company_name);
          return {
            ...internship,
            companyName: internship.company_name || (comp ? comp.companyName || comp.company_name : "Unknown Company")
          };
        })
        .filter(i => {
          const isActive = i.status !== "CLOSED" && i.status !== "FULL";
          const deptMatch = !studentDepartment || 
            String(i.department).trim().toLowerCase() === String(studentDepartment).trim().toLowerCase();
            
          return isActive && deptMatch;
        });

      setInternships(processed);
    } catch (error) {
      console.error("Error loading internships:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading internships...</div>;

  const handleApplySubmit = async (applicationData) => {
    try {
      const studentName = JSON.parse(localStorage.getItem("student"))?.name || 
                          JSON.parse(localStorage.getItem("student"))?.fullName || "Student";
      
      const applications = JSON.parse(localStorage.getItem("applications")) || [];
      const existing = applications.find(
        (app) =>
          (app.studentId === studentId || app.studentName === studentName) &&
          app.internshipId === selectedInternship.id
      );

      if (existing) {
        alert("You have already applied to this internship.");
        return;
      }

      const newApplication = {
        id: Date.now(),
        ...applicationData,
        studentId,
        studentName,
        internshipId: selectedInternship.id,
        internshipTitle: selectedInternship.title,
        status: "Pending",
        applicationStatus: "PENDING_COMPANY_REVIEW",
        acceptanceForm: buildInitialAcceptanceForm({
          student: studentProfile,
          internship: selectedInternship,
          applicationData,
        }),
        appliedAt: new Date().toISOString(),
      };

      applications.push(newApplication);
      localStorage.setItem("applications", JSON.stringify(applications));

      const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
      notifications.push({
        id: Date.now(),
        type: "info",
        title: `Application submitted for ${selectedInternship.title} at ${applicationData.companyName}`,
        message: "Your application is pending review",
        date: new Date().toISOString(),
        studentId,
        studentName,
      });
      localStorage.setItem("notifications", JSON.stringify(notifications));

      if (onApplicationSubmit) {
        onApplicationSubmit(newApplication);
      }

      alert(`Successfully applied to ${selectedInternship.title}!`);
      setIsApplyModalOpen(false);
      setSelectedInternship(null);
    } catch (error) {
      console.error("Error submitting internship application:", error);
      alert("Error submitting application. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Available Internships</h2>
        <p className="text-gray-600">Browse and apply to new internship postings</p>
      </div>

      {internships.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No active internships right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.map(internship => (
            <div key={internship.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-blue-50/30">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{internship.title}</h3>
              <div className="flex items-center gap-2 mb-3 text-sm text-blue-700 font-medium">
                <Building2 className="w-4 h-4" />
                <span>{internship.companyName}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{internship.total_hours || internship.Total_hours} hrs/day • {internship.days_in_week || internship.Days_in_week} days/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{internship.number_interns} Positions Available</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInternship(internship)}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedInternship && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedInternship.title}</h2>
                  <p className="text-gray-700 font-medium mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {selectedInternship.companyName}
                  </p>
                  <p className="text-blue-600 font-medium">{selectedInternship.start_date} to {selectedInternship.end_date}</p>
                </div>
                <button 
                  onClick={() => setSelectedInternship(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                   <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-blue-200"><Layers className="w-4 h-4 text-blue-600" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-blue-600">Department</p>
                         <p className="text-sm font-bold text-gray-900">{selectedInternship.department}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-blue-200"><MapPin className="w-4 h-4 text-blue-600" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-blue-600">Location</p>
                         <p className="text-sm font-bold text-gray-900">{selectedInternship.location} ({selectedInternship.internship_type})</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-blue-200"><CheckCircle className="w-4 h-4 text-blue-600" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-blue-600">Status</p>
                         <p className="text-sm font-bold text-gray-900">{selectedInternship.status || "ACTIVE"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-blue-200"><Clock className="w-4 h-4 text-blue-600" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-blue-600">Schedule</p>
                         <p className="text-sm font-bold text-gray-900">{selectedInternship.days_in_week || selectedInternship.Days_in_week} days/week</p>
                      </div>
                   </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedInternship.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInternship.required_skills?.map((skill, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Hours</h5>
                    <p className="font-medium text-lg">{selectedInternship.total_hours || selectedInternship.Total_hours} <span className="text-xs font-normal">hrs</span></p>
                  </div>
                  <div>
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Positions</h5>
                    <p className="font-medium text-lg">{selectedInternship.number_interns} <span className="text-xs font-normal">Openings</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end pt-4 border-t">
                <button 
                  onClick={() => setSelectedInternship(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isApplyModalOpen && selectedInternship && (
        <ApplicationModal
          company={{ 
            ...selectedInternship, 
            id: selectedInternship.company_id || selectedInternship.id,
            companyName: selectedInternship.companyName || selectedInternship.company_name 
          }}
          studentId={studentId}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
};

const AppliedInternshipsList = ({ studentId, studentName }) => {
  const [appliedInternships, setAppliedInternships] = useState([]);
  const [previewForm, setPreviewForm] = useState(null);

  useEffect(() => {
    const loadApplied = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const studentApps = allApps.filter(
        (app) => app.studentId === studentId || app.studentName === studentName
      );
      setAppliedInternships(studentApps.sort((a,b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
    };

    loadApplied();
    window.addEventListener("storage", loadApplied);
    return () => window.removeEventListener("storage", loadApplied);
  }, [studentId, studentName]);

  const handleSelectCompany = (app) => {
    const s = app.status?.toLowerCase();
    if (s !== 'accepted' && s !== 'accepted_by_company' && s !== 'active') {
       alert("This application hasn't been accepted by the company yet.");
       return;
    }

    try {
      // 1. Check if student already has a PENDING approval or an ACTIVE internship
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const studentApps = allApps.filter(a => a.studentId === studentId || a.studentName === studentName);
      
      const hasPending = studentApps.some(a => a.coordinatorApprovalStatus === "PENDING");
      const hasActive = studentApps.some(a => a.finalInternshipStatus === "ACTIVE_INTERN" || a.status === "CONFIRMED");

      if (hasPending || hasActive) {
        alert("You already selected another internship.");
        return;
      }

      if (window.confirm(`Are you sure you want to select ${app.companyName} for your internship? This will be sent to the Coordinator for final approval.`)) {
        // Update the specific application
        const updatedApps = allApps.map(a => 
          a.id === app.id ? { ...a, coordinatorApprovalStatus: "PENDING", applicationStatus: "SUBMITTED_TO_COORDINATOR", selectedAt: new Date().toISOString() } : a
        );
        localStorage.setItem("applications", JSON.stringify(updatedApps));
        
        alert(`Request sent! Your selection of ${app.companyName} is now pending coordinator approval.`);
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Selection failed:", err);
    }
  };

  const formatAcceptanceStatus = (app) => {
    if (app.acceptanceForm?.accepted) return "Accepted";
    if (app.acceptanceForm?.rejected) return "Rejected";
    return "Pending";
  };

  const getStatusDisplay = (status, coordStatus) => {
    const s = status?.toLowerCase();
    const cs = coordStatus;

    if (cs === "APPROVED") {
       return { text: 'Finalized', classes: 'bg-green-600 text-white border-green-700', canSelect: false };
    }
    if (cs === "PENDING") {
       return { text: 'Pending Approval', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200', canSelect: false };
    }
    if (cs === "REJECTED") {
       return { text: 'Coord. Rejected', classes: 'bg-gray-100 text-gray-400 border-gray-200', canSelect: true };
    }

    if (s === 'accepted' || s === 'accepted_by_company' || s === 'active') {
      return { 
        text: 'Accepted', 
        classes: 'bg-green-100 text-green-700 border-green-200',
        canSelect: true 
      };
    }
    if (s === 'rejected') {
      return { 
        text: 'Rejected', 
        classes: 'bg-red-100 text-red-700 border-red-200',
        canSelect: false 
      };
    }
    return { 
      text: 'Waiting Response', 
      classes: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      canSelect: false 
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Applied Internships</h2>
        <p className="text-gray-600">Track and finalize your internship placements</p>
      </div>

      {appliedInternships.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
           <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-500">You haven't applied to any internships yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appliedInternships.map(app => {
            const statusConfig = getStatusDisplay(app.status, app.coordinatorApprovalStatus);
            return (
              <div key={app.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border border-gray-100 rounded-xl bg-gray-50/50 gap-4 hover:border-blue-200 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{app.internshipTitle || "Internship"}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Building2 className="w-3 h-3" />
                        <span>{app.companyName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <FileText className="w-3 h-3" />
                        <span>Acceptance Form: {formatAcceptanceStatus(app)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                   <button
                     onClick={() => setPreviewForm(app)}
                     className="px-4 py-1.5 border border-gray-300 text-gray-700 text-xs font-black uppercase rounded-full hover:bg-gray-100 transition-all w-full sm:w-auto whitespace-nowrap"
                   >
                     View Form
                   </button>
                   <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border text-center w-full sm:w-auto ${statusConfig.classes}`}>
                     {statusConfig.text}
                   </span>
                   {statusConfig.canSelect && (
                     <button 
                       onClick={() => handleSelectCompany(app)}
                       className="px-4 py-1.5 bg-blue-600 text-white text-xs font-black uppercase rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 w-full sm:w-auto whitespace-nowrap"
                     >
                       Select This Company
                     </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewForm && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 flex items-start justify-center overflow-y-auto">
          <div className="w-full max-w-5xl mt-8 mb-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Completed Acceptance Form - {previewForm.companyName}</h3>
              <button onClick={() => setPreviewForm(null)} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <InternshipAcceptanceForm initialData={previewForm.acceptanceForm} readOnly showActions />
          </div>
        </div>
      )}
    </div>
  );
};

const MyInternshipView = ({ studentId, studentName }) => {
  const [activeApp, setActiveApp] = useState(null);
  const [weeklyLogbook, setWeeklyLogbook] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [draftWeek, setDraftWeek] = useState(null);
  const [internshipSubTab, setInternshipSubTab] = useState("logbook");
  const [documents, setDocuments] = useState([]);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState(false);
  const docFileInputRef = useRef(null);
  const [advisorOwnEval, setAdvisorOwnEval] = useState(null);

  useEffect(() => {
    const loadActive = () => {
      const allApps = JSON.parse(localStorage.getItem("applications")) || [];
      const companies = JSON.parse(localStorage.getItem("companies")) || [];
      const internships = JSON.parse(localStorage.getItem("allInternships")) || [];
      
      const found = allApps.find(app => 
        (app.studentId === studentId || app.studentName === studentName) && 
        app.finalInternshipStatus === "ACTIVE_INTERN"
      );

      if (found) {
        const company = companies.find(c => c.company_id === found.companyId || c.id === found.companyId || c.companyName === found.companyName);
        const internship = internships.find(i => i.id === found.internshipId);
        setActiveApp({
          ...found,
          companyFull: company,
          internshipFull: internship
        });
        const logbookRecord = ensureWeeklyLogbookForInternship({
          studentId: found.studentId,
          internshipId: found.internshipId || found.id,
          companyId: found.companyId || found.companyName || "",
          advisorId: found.advisorName || "",
        });
        setWeeklyLogbook(logbookRecord);
      } else {
        setActiveApp(null);
        setWeeklyLogbook(null);
      }
    };

    loadActive();
    window.addEventListener("storage", loadActive);
    return () => window.removeEventListener("storage", loadActive);
  }, [studentId, studentName]);

  const refreshDocuments = () => {
    setDocuments(getDocumentsByStudentId(String(studentId)));
  };

  useEffect(() => {
    refreshDocuments();
    window.addEventListener("storage", refreshDocuments);
    return () => window.removeEventListener("storage", refreshDocuments);
  }, [studentId]);

  useEffect(() => {
    const loadAdvisorEval = () => {
      setAdvisorOwnEval(getAdvisorEvaluation(studentId));
    };
    loadAdvisorEval();
    const onUpdate = () => loadAdvisorEval();
    window.addEventListener("storage", onUpdate);
    window.addEventListener("advisor-evaluation-updated", onUpdate);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("advisor-evaluation-updated", onUpdate);
    };
  }, [studentId]);

  const handleDocFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDocFile(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDocumentSubmit = (e) => {
    e.preventDefault();
    if (!activeApp || !docFile) {
      alert("Please choose a file to upload.");
      return;
    }
    setDocSubmitting(true);
    try {
      submitInternshipDocument({
        studentId: activeApp.studentId,
        studentName: activeApp.studentName || studentName,
        title: docTitle || docFileName || "Internship document",
        description: docDescription,
        fileName: docFileName || "document",
        fileData: docFile,
        advisorName: activeApp.advisorName || "",
        examinerName: activeApp.examinerName || "",
        examiner2Name: activeApp.examiner2Name || "",
      });
      setDocTitle("");
      setDocDescription("");
      setDocFile(null);
      setDocFileName("");
      if (docFileInputRef.current) docFileInputRef.current.value = "";
      refreshDocuments();
      setDocUploadSuccess(true);
      window.setTimeout(() => setDocUploadSuccess(false), 4000);
    } finally {
      setDocSubmitting(false);
    }
  };

  const rolePill = (status) => {
    if (status === ROLE_DOC_STATUS.APPROVED) return "bg-green-100 text-green-800 border-green-200";
    if (status === ROLE_DOC_STATUS.REJECTED) return "bg-red-100 text-red-800 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const openWeek = (week) => {
    setSelectedWeek(week);
    setDraftWeek(JSON.parse(JSON.stringify(week)));
  };

  const closeWeek = () => {
    setSelectedWeek(null);
    setDraftWeek(null);
  };

  const handleLogbookFormSubmit = (payload) => {
    if (!activeApp || !selectedWeek) return;
    const weekPayload = payload?.weeks?.[0];
    if (!weekPayload) return;

    updateWeeklyLogbookMeta(
      {
        studentId: activeApp.studentId,
        internshipId: activeApp.internshipId || activeApp.id,
        companyId: activeApp.companyId || activeApp.companyName || "",
        advisorId: activeApp.advisorName || "",
      },
      {
        studentName: payload.studentName || "",
        companyName: payload.companyName || "",
        safetyBrief: payload.safetyBrief || "",
      }
    );

    const mergedDays = weekPayload.days.map((d, i) => ({
      dayNumber: selectedWeek.days[i]?.dayNumber ?? i + 1,
      workPerformed: d.workPerformed,
      supervisorComment: selectedWeek.days[i]?.supervisorComment ?? "",
    }));

    const updated = updateWeekForInternship(
      {
        studentId: activeApp.studentId,
        internshipId: activeApp.internshipId || activeApp.id,
        companyId: activeApp.companyId || activeApp.companyName || "",
        advisorId: activeApp.advisorName || "",
      },
      selectedWeek.weekNumber,
      (week) => ({
        ...week,
        days: mergedDays,
        status: WEEK_STATUS.PENDING_COMPANY,
        companyStatus: "PENDING",
        advisorStatus: "PENDING",
      })
    );
    setWeeklyLogbook(updated);
    closeWeek();
  };

  const getStatusPill = (status) => {
    const map = {
      [WEEK_STATUS.NOT_SUBMITTED]: "bg-gray-100 text-gray-700 border-gray-200",
      [WEEK_STATUS.PENDING_COMPANY]: "bg-yellow-100 text-yellow-700 border-yellow-200",
      [WEEK_STATUS.REJECTED_COMPANY]: "bg-red-100 text-red-700 border-red-200",
      [WEEK_STATUS.PENDING_ADVISOR]: "bg-blue-100 text-blue-700 border-blue-200",
      [WEEK_STATUS.REJECTED_ADVISOR]: "bg-red-100 text-red-700 border-red-200",
      [WEEK_STATUS.APPROVED]: "bg-green-100 text-green-700 border-green-200",
    };
    return map[status] || map[WEEK_STATUS.NOT_SUBMITTED];
  };

  if (!activeApp) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <Briefcase className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Internship Yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Once your coordinator finalizes your internship approval, your active placement details will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Building2 className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Official Placement</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Intern at {activeApp.companyName}</h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/30 text-xs font-black uppercase">
              <CheckCircle className="w-4 h-4" />
              Verified & Active
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Company Deep Dive */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-600 w-fit">
                 <Building2 className="w-5 h-5 text-blue-600" />
                 <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Partner Organization</h4>
              </div>
              <div className="space-y-4">
                 <p className="text-2xl font-bold text-gray-900">{activeApp.companyName}</p>
                 <div className="flex items-center gap-2 text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{activeApp.companyFull?.location || "Location provided by system"}</span>
                 </div>
                 <p className="text-gray-600 leading-relaxed italic text-sm border-l-4 border-gray-100 pl-4">
                   "{activeApp.companyFull?.description || "A registered host organization participating in the AASTU internship tracking program."}"
                 </p>
              </div>
            </div>

            {/* Position Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-purple-600 w-fit">
                 <Briefcase className="w-5 h-5 text-purple-600" />
                 <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Internship Role</h4>
              </div>
              <div className="space-y-4">
                 <p className="text-xl font-bold text-gray-900">{activeApp.internshipTitle}</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                       <p className="text-[10px] font-black text-purple-700 uppercase mb-1">Timeframe</p>
                       <p className="text-xs font-bold text-gray-700">{activeApp.internshipFull?.start_date} — {activeApp.internshipFull?.end_date}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                       <p className="text-[10px] font-black text-purple-700 uppercase mb-1">Weekly Commitment</p>
                       <p className="text-xs font-bold text-gray-700">{activeApp.internshipFull?.total_hours || "160"} Total Hrs</p>
                    </div>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Academic Supervision</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Academic Advisor</p>
                          <p className="text-sm font-black text-gray-900">{activeApp.advisorName || "Awaiting Assignment"}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Internal Examiner 1</p>
                          <p className="text-sm font-black text-gray-900">{activeApp.examinerName || "Awaiting Assignment"}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Internal Examiner 2</p>
                          <p className="text-sm font-black text-gray-900">{activeApp.examiner2Name || "Awaiting Assignment"}</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Required Skills & Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                       {(activeApp.internshipFull?.required_skills || ["Professional Development"]).map((skill, i) => (
                         <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-bold text-gray-600">
                           {skill}
                         </span>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-100 pb-4">
          <button
            type="button"
            onClick={() => setInternshipSubTab("logbook")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              internshipSubTab === "logbook"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Weekly logbook
          </button>
          <button
            type="button"
            onClick={() => setInternshipSubTab("documents")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              internshipSubTab === "documents"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-4 h-4" />
            Document upload
          </button>
          <button
            type="button"
            onClick={() => setInternshipSubTab("advisor-eval")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              internshipSubTab === "advisor-eval"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            Advisor evaluation
            {advisorOwnEval?.status === ADVISOR_EVAL_STATUS.SUBMITTED && (
              <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" title="Available" />
            )}
          </button>
        </div>

        {internshipSubTab === "logbook" && (
          <>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Weekly Logbook (8 Weeks)</h3>
              <p className="text-sm text-gray-600">
                Click any week to view details, update work log (if editable), and submit.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(weeklyLogbook?.weeks || []).map((week) => (
                <button
                  key={week.weekNumber}
                  type="button"
                  onClick={() => openWeek(week)}
                  className="text-left p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <p className="font-black text-gray-900 text-sm uppercase">Week {week.weekNumber}</p>
                  <span className={`mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusPill(week.status)}`}>
                    {STATUS_LABELS[week.status]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {internshipSubTab === "documents" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Internship documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload reports or evidence for your advisor and internal examiner. They are notified and each must approve your submission.
              </p>
              {docUploadSuccess && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                  Submitted — your file was sent to your assigned advisor and examiner for review.
                </div>
              )}
              <form onSubmit={handleDocumentSubmit} className="space-y-4 max-w-xl border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Document title</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                    placeholder="e.g. Mid-internship report"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (optional)</label>
                  <textarea
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                    placeholder="Short description for your reviewers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">File</label>
                  <input
                    ref={docFileInputRef}
                    type="file"
                    onChange={handleDocFile}
                    className="w-full text-sm"
                  />
                  {docFileName && <p className="text-xs text-gray-500 mt-1">Selected: {docFileName}</p>}
                </div>
                <button
                  type="submit"
                  disabled={docSubmitting || !docFile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {docSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : docUploadSuccess ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {docSubmitting ? "Submitting…" : docUploadSuccess ? "Submitted" : "Submit to advisor & examiner"}
                </button>
              </form>
            </div>

            <div>
              <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Your submissions</h4>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {documents.map((d) => {
                    const summary = getStudentDocumentSummary(d);
                    const tone =
                      summary.tone === "green"
                        ? "border-green-200 bg-green-50/40"
                        : summary.tone === "red"
                          ? "border-red-200 bg-red-50/30"
                          : summary.tone === "amber"
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-gray-200 bg-white";
                    return (
                      <li key={d.id} className={`rounded-xl border p-4 ${tone}`}>
                        <div className="flex flex-wrap justify-between gap-2 items-start">
                          <div>
                            <p className="font-bold text-gray-900">{d.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted {new Date(d.submittedAt).toLocaleString()}
                            </p>
                            {d.description && (
                              <p className="text-sm text-gray-600 mt-2">{d.description}</p>
                            )}
                          </div>
                          <a
                            href={d.fileData}
                            download={d.fileName}
                            className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                          >
                            Download
                          </a>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-3">{summary.text}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${rolePill(d.advisorStatus)}`}>
                            Advisor: {d.advisorStatus}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${rolePill(d.examinerStatus)}`}>
                            Examiner: {d.examinerStatus}
                          </span>
                        </div>
                        {(d.advisorComment || d.examinerComment) && (
                          <div className="mt-3 text-xs text-gray-600 space-y-1">
                            {d.advisorComment && <p><span className="font-bold">Advisor:</span> {d.advisorComment}</p>}
                            {d.examinerComment && <p><span className="font-bold">Examiner:</span> {d.examinerComment}</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {internshipSubTab === "advisor-eval" && (
          <div className="space-y-4">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-900">Advisor evaluation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your academic advisor&apos;s assessment of your internship. It appears here once they submit it.
              </p>
            </div>
            {!advisorOwnEval || advisorOwnEval.status !== ADVISOR_EVAL_STATUS.SUBMITTED ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
                Your advisor has not submitted their evaluation yet. You will be notified when it is ready.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Submitted {new Date(advisorOwnEval.submittedAt).toLocaleString()}
                  {advisorOwnEval.advisorName && (
                    <span className="block mt-1 font-semibold text-gray-800">
                      Advisor: {advisorOwnEval.advisorName}
                    </span>
                  )}
                </p>
                <AdvisorStudentEvaluationForm
                  readOnly
                  initialData={{
                    ...(advisorOwnEval.formData || {}),
                    studentName: activeApp.studentName || studentName,
                    studentId: activeApp.studentId || studentId,
                    department: activeApp.department || "",
                    companyName: activeApp.companyName || "",
                    internshipTitle: activeApp.internshipTitle || "",
                  }}
                />
              </>
            )}
          </div>
        )}

      </div>

      {selectedWeek && draftWeek && (
        <div className="fixed inset-0 bg-black/60 z-[180] p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto mt-8 mb-8 bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Week {selectedWeek.weekNumber} Logbook</h3>
              <button onClick={closeWeek} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs font-bold">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">Status: {STATUS_LABELS[draftWeek.status]}</div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">Company: {draftWeek.companyStatus}</div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">Advisor: {draftWeek.advisorStatus}</div>
            </div>

            <InternshipLogbookForm
              key={selectedWeek.weekNumber}
              role="student"
              title={`Internship Student Logbook Form - Week ${selectedWeek.weekNumber}`}
              readOnly={!canStudentEditWeek(draftWeek.status)}
              submitLabel="Submit Week to Company"
              onSubmit={handleLogbookFormSubmit}
              initialData={{
                studentName: weeklyLogbook?.meta?.studentName || activeApp?.studentName || studentName || "",
                companyName: weeklyLogbook?.meta?.companyName || activeApp?.companyName || "",
                supervisorName: weeklyLogbook?.meta?.supervisorName || "",
                safetyBrief: weeklyLogbook?.meta?.safetyBrief || "",
                weeks: [draftWeek],
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SelfPlacementSection = ({ studentId, onSubmit }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    representativeName: "",
    representativeEmail: "",
    representativePhone: "",
    location: "",
    companyLicense: null,
    licenseFileName: "",
    additionalNotes: "",
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          companyLicense: event.target.result,
          licenseFileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.representativeEmail || !formData.companyLicense) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const selfPlacementData = {
        id: Date.now(),
        studentId,
        ...formData,
        status: "Pending Verification",
        submittedAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem("selfPlacements")) || [];
      existing.push(selfPlacementData);
      localStorage.setItem("selfPlacements", JSON.stringify(existing));

      setStatus("Pending Verification");
      setFormData({
        companyName: "",
        representativeName: "",
        representativeEmail: "",
        representativePhone: "",
        location: "",
        companyLicense: null,
        licenseFileName: "",
        additionalNotes: "",
      });
      setIsFormOpen(false);

      if (onSubmit) onSubmit(selfPlacementData);
    } catch (error) {
      console.error("Error submitting self-placement:", error);
      alert("Error submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const selfPlacements = JSON.parse(localStorage.getItem("selfPlacements")) || [];
    const studentPlacement = selfPlacements.find((sp) => sp.studentId === studentId);
    if (studentPlacement) {
      setStatus(studentPlacement.status);
    }
  }, [studentId]);

  const getStatusColor = (status) => {
    const statusMap = {
      "Pending Verification": "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Self-Placement Request</h3>
          <p className="text-sm text-gray-600">Submit a company for internship placement verification</p>
        </div>
        {status && (
          <div
            className={`px-4 py-2 rounded-lg border font-medium text-sm ${getStatusColor(
              status
            )}`}
          >
            {status}
          </div>
        )}
      </div>

      {!status ? (
        <>
          {!isFormOpen ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Upload className="w-5 h-5" />
              Submit Self-Placement Request
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Representative Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Representative Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="representativeEmail"
                      value={formData.representativeEmail}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Representative Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="representativePhone"
                    value={formData.representativePhone}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company License <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id="license-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="license-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {formData.licenseFileName ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>{formData.licenseFileName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload company license</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any additional information about the company..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({
                      companyName: "",
                      representativeName: "",
                      representativeEmail: "",
                      representativePhone: "",
                      location: "",
                      companyLicense: null,
                      licenseFileName: "",
                      additionalNotes: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Your self-placement request status: <span className="font-semibold">{status}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Notifications panel (inlined)
const NotificationsPanel = ({ studentId, studentName }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const allNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const studentNotifications = allNotifications
      .filter((n) => n.studentId === studentId || n.studentName === studentName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const studentApps = applications.filter(
      (app) => app.studentId === studentId || app.studentName === studentName
    );

    const appNotifications = studentApps
      .filter((app) => app.status && app.status !== "applied")
      .map((app) => ({
        id: `app-${app.id}`,
        type: app.status === "accepted" ? "success" : app.status === "rejected" ? "error" : "info",
        title:
          app.status === "accepted"
            ? `${app.companyName} accepted your application`
            : app.status === "rejected"
            ? `${app.companyName} rejected your application`
            : `Update on your application to ${app.companyName}`,
        message: app.statusMessage || "",
        date: app.updatedAt || app.appliedAt,
        studentId,
        studentName,
      }));

  const merged = [...studentNotifications, ...appNotifications];
  const unique = merged.filter(
    (n, index, self) => index === self.findIndex((t) => t.id === n.id)
  );
  setNotifications(unique.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10));
  }, [studentId, studentName]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Clock,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      success: "text-green-600 bg-green-50",
      error: "text-red-600 bg-red-50",
      warning: "text-yellow-600 bg-yellow-50",
      info: "text-blue-600 bg-blue-50",
    };
    return colorMap[type] || "text-gray-600 bg-gray-50";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-bold text-gray-900">Recent Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            You'll see updates about your applications here
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow ${colorClass}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    {notification.message && (
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDate(notification.date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { studentName, userName } = location.state || {};
  
  const [studentData, setStudentData] = useState(null);
  const [internshipStatus, setInternshipStatus] = useState("Not Applied");
  const [notificationCount, setNotificationCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [advisor, setAdvisor] = useState(null);
  const [examiner, setExaminer] = useState(null);
  const [examiner2, setExaminer2] = useState(null);

  const resolveDisplayName = (u) => {
    if (!u || typeof u !== "object") return "";
    return (
      u?.name ||
      u?.fullName ||
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
      u?.username ||
      ""
    );
  };

  useEffect(() => {
    // Get student data from localStorage or context
    const storedStudent = JSON.parse(localStorage.getItem("student")) || {};
    const name =
      resolveDisplayName(user) ||
      studentName ||
      userName ||
      resolveDisplayName(storedStudent) ||
      "Student";
    const studentId = user?.id || user?.studentId || user?.student_id || storedStudent.id || storedStudent.studentId || storedStudent.student_id || "";
    const department = user?.department || storedStudent.department || "";
    const college = user?.college || storedStudent.college || "Addis Ababa Science and Technology University";
    const email = user?.email || storedStudent.email || "";

    console.log("👨‍🎓 Student data loaded:", { name, studentId, department, email, storedStudent, user });

    setStudentData({
      name,
      studentId,
      department,
      college,
      email,
    });

    // Load assignment information (advisor and examiner)
    loadAssignment(studentId, name, email, department);

    // Load applications to determine status
    loadApplications(studentId, name);
    
    // Load notification count
    loadNotificationCount(studentId, name);
  }, [user, studentName, userName]);

  // Listen for storage changes to refresh assignments
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "studentAssignments" && studentData) {
        loadAssignment(studentData.studentId, studentData.name, studentData.email, studentData.department);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = () => {
      if (studentData) {
        loadAssignment(studentData.studentId, studentData.name, studentData.email, studentData.department);
      }
    };

    // Custom event listener for same-tab updates
    window.addEventListener("localStorageChange", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageChange", handleCustomStorageChange);
    };
  }, [studentData]);

  const loadAssignment = (studentId, studentName, studentEmail, department) => {
    try {
      const assignments = JSON.parse(localStorage.getItem("studentAssignments")) || [];
      const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
      
      console.log("🔍 Loading assignment for:", { studentId, studentName, studentEmail, department });
      console.log("📋 Available assignments:", assignments);
      
      if (assignments.length === 0) {
        console.log("❌ No assignments found in localStorage");
        setAdvisor(null);
        setExaminer(null);
        setExaminer2(null);
        return;
      }
      
      // Try multiple matching strategies - be more flexible with matching
      // First try with department match, then without
      let assignment = assignments.find((a) => {
        const sidMatch = studentId && a.studentId && 
          a.studentId.toString().toLowerCase().trim() === studentId.toString().toLowerCase().trim();
          
        const emailMatch = studentEmail && a.email && 
          a.email.toLowerCase().trim() === studentEmail.toLowerCase().trim();

        const sName = (studentName || "").toLowerCase().trim();
        const aName = (a.studentName || "").toLowerCase().trim();
        const nameMatch = sName && aName && (aName === sName || aName.includes(sName) || sName.includes(aName));

        // If ID matches, we don't care about department mismatch
        if (sidMatch) return true;
        
        // If email matches, it's definitively them
        if (emailMatch) return true;

        if (nameMatch) {
          const aDept = (a.department || "").toLowerCase().trim();
          const sDept = (department || "").toLowerCase().trim();
          return department ? aDept === sDept : true;
        }
        
        return false;
      });



      if (assignment) {
        console.log("✅ Found assignment:", assignment);
        
        // Get full names from otherUsers
        let advisorName = assignment.advisor;
        let examinerName = assignment.examiner;
        let examiner2Name = assignment.examiner2;
        
        if (assignment.advisor) {
          const advisorUser = otherUsers.find(u => u.username === assignment.advisor && u.role === "Advisor");
          if (advisorUser) {
            advisorName = advisorUser.fullName || advisorUser.name || advisorUser.username;
            console.log("👤 Advisor found:", advisorName);
          } else {
            console.log("⚠️ Advisor username not found in otherUsers:", assignment.advisor);
          }
        }
        
        if (assignment.examiner) {
          const examinerUser = otherUsers.find(u => u.username === assignment.examiner && u.role === "Examiner");
          if (examinerUser) {
            examinerName = examinerUser.fullName || examinerUser.name || examinerUser.username;
            console.log("👤 Examiner found:", examinerName);
          } else {
            console.log("⚠️ Examiner username not found in otherUsers:", assignment.examiner);
          }
        }

        if (assignment.examiner2) {
          const examiner2User = otherUsers.find(u => u.username === assignment.examiner2 && u.role === "Examiner");
          if (examiner2User) {
            examiner2Name = examiner2User.fullName || examiner2User.name || examiner2User.username;
          }
        }
        
        setAdvisor(advisorName || null);
        setExaminer(examinerName || null);
        setExaminer2(examiner2Name || null);
      } else {
        console.log("❌ No matching assignment found");
        setAdvisor(null);
        setExaminer(null);
        setExaminer2(null);
      }

      const apps = JSON.parse(localStorage.getItem("applications")) || [];
      const activeIntern = apps.find(
        (a) =>
          (a.studentId === studentId || a.studentName === studentName) &&
          a.finalInternshipStatus === "ACTIVE_INTERN"
      );
      if (activeIntern) {
        if (activeIntern.advisorName) setAdvisor(activeIntern.advisorName);
        if (activeIntern.examinerName) setExaminer(activeIntern.examinerName);
        if (activeIntern.examiner2Name) setExaminer2(activeIntern.examiner2Name);
      }
    } catch (error) {
      console.error("❌ Error loading assignment:", error);
      setAdvisor(null);
      setExaminer(null);
      setExaminer2(null);
    }
  };

  const [activeTab, setActiveTab] = useState("my-internship"); // my-internship, browse, applied, self-placement

  const loadApplications = (studentId, studentName) => {
    try {
      const apps = JSON.parse(localStorage.getItem("applications")) || [];
      const studentApps = apps.filter(
        (app) => app.studentId === studentId || app.studentName === studentName
      );
      setApplications(studentApps);

      // Determine internship status
      if (studentApps.length === 0) {
        setInternshipStatus("Not Applied");
      } else {
        const activeApp = studentApps.find((app) => app.coordinatorApprovalStatus === "APPROVED");
        const awaitingApproval = studentApps.find((app) => app.coordinatorApprovalStatus === "PENDING");
        const pendingCompany = studentApps.find((app) => app.status === "Pending" || app.status === "applied" || app.status === "APPLIED");
        const acceptedByCompany = studentApps.find((app) => app.status === "accepted" || app.status === "ACCEPTED_BY_COMPANY");
        const completedApp = studentApps.find((app) => app.status === "Completed");

        if (activeApp) {
          setInternshipStatus("Active");
        } else if (completedApp) {
          setInternshipStatus("Completed");
        } else if (awaitingApproval) {
          setInternshipStatus("Pending Approval");
        } else if (acceptedByCompany) {
          setInternshipStatus("Company Accepted");
        } else if (pendingCompany) {
          setInternshipStatus("Applied");
        } else {
          setInternshipStatus("Not Applied");
        }
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  const loadNotificationCount = (studentId, studentName) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
      const unreadCount = allNotifications.filter(
        (n) => (n.studentId === studentId || n.studentName === studentName) && !n.read
      ).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleApplicationSubmit = (newApplication) => {
    // Reload applications and update status
    loadApplications(studentData?.studentId, studentData?.name);
    loadNotificationCount(studentData?.studentId, studentData?.name);
  };

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <TopNavigation
        studentName={studentData.name}
        notificationCount={notificationCount}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <WelcomeHeader
          studentName={studentData.name}
          department={studentData.department}
          college={studentData.college}
          internshipStatus={internshipStatus}
          advisor={advisor}
          examiner={examiner}
          examiner2={examiner2}
        />

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-3xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("my-internship")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "my-internship" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            My Internship
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "browse" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Browse Opportunities
          </button>
          <button
            onClick={() => setActiveTab("applied")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "applied" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            My Applications
          </button>
          <button
            onClick={() => setActiveTab("self-placement")}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "self-placement" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Upload className="w-4 h-4" />
            Self Placement
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "my-internship" && (
              <MyInternshipView 
                studentId={studentData.studentId}
                studentName={studentData.name}
              />
            )}

            {activeTab === "browse" && (
              <AvailableInternships 
                studentId={studentData.studentId}
                studentDepartment={studentData.department}
                studentProfile={studentData}
                onApplicationSubmit={handleApplicationSubmit}
              />
            )}

            {activeTab === "applied" && (
              <AppliedInternshipsList 
                studentId={studentData.studentId}
                studentName={studentData.name}
              />
            )}

            {activeTab === "self-placement" && (
              <SelfPlacementSection
                studentId={studentData.studentId}
                onSubmit={handleApplicationSubmit}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Notifications Panel */}
            <NotificationsPanel
              studentId={studentData.studentId}
              studentName={studentData.name}
            />

            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="text-lg font-bold text-gray-900">
                    {applications.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {applications.filter((app) => app.status === "Pending" || app.status === "applied").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-lg font-bold text-green-600">
                    {applications.filter((app) => app.status === "Active" || app.status === "accepted").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
