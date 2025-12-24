import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, ChevronDown, CheckCircle, Clock, XCircle, AlertCircle, Upload, FileText, MapPin, Building2, User, Mail, Phone, Loader2, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";
import ApplicationModal from "./modals/ApplicationModal";

// Company card (inlined)
const CompanyCard = ({ company, onViewDetails, onApply }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">{company.companyName}</h3>
          </div>
          {company.verified && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Verified Company
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {company.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{company.location}</span>
          </div>
        )}
        {company.industryType && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Industry:</span> {company.industryType}
          </div>
        )}
        {company.contactEmail && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {company.contactEmail}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onViewDetails(company)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={() => onApply(company)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
);

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
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex px-3 py-2 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
            >
              Logout
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {studentName?.charAt(0)?.toUpperCase() || "S"}
                </div>
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
const WelcomeHeader = ({ studentName, department, college, internshipStatus }) => {
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
    </div>
  );
};

// Verified companies (inlined)
const VerifiedCompaniesList = ({ studentId, studentName, onApplicationSubmit }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("companies")) || [];
      const verified = stored.filter((c) => c.verified === true);
      setCompanies(verified);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleApply = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleApplicationSubmit = async (applicationData) => {
    try {
      const applications = JSON.parse(localStorage.getItem("applications")) || [];
      const existing = applications.find(
        (app) =>
          (app.studentId === studentId || app.studentName === studentName) &&
          app.companyId === applicationData.companyId
      );

      if (existing) {
        alert("You have already applied to this company.");
        return;
      }

      const newApplication = {
        id: Date.now(),
        ...applicationData,
        studentId,
        studentName,
        status: "Pending",
        appliedAt: new Date().toISOString(),
      };

      applications.push(newApplication);
      localStorage.setItem("applications", JSON.stringify(applications));

      const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
      notifications.push({
        id: Date.now(),
        type: "info",
        title: `Application submitted to ${applicationData.companyName}`,
        message: "Your application is pending review",
        date: new Date().toISOString(),
        studentId,
        studentName,
      });
      localStorage.setItem("notifications", JSON.stringify(notifications));

      if (onApplicationSubmit) {
        onApplicationSubmit(newApplication);
      }

      alert(`Successfully applied to ${applicationData.companyName}!`);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Verified Companies</h2>
          <p className="text-gray-600">Browse and apply to verified internship opportunities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${
              viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } transition-colors`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${
              viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } transition-colors`}
          >
            List
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verified Companies Available</h3>
          <p className="text-gray-600">There are no verified companies at the moment. Check back later.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onViewDetails={handleViewDetails}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {selectedCompany && (
        <ApplicationModal
          company={selectedCompany}
          studentId={studentId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

// Self placement (inlined)
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
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
  const { student } = useAuth();
  const { studentName } = location.state || {};
  
  const [studentData, setStudentData] = useState(null);
  const [internshipStatus, setInternshipStatus] = useState("Not Applied");
  const [notificationCount, setNotificationCount] = useState(0);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Get student data from localStorage or context
    const storedStudent = JSON.parse(localStorage.getItem("student")) || {};
    const name = student?.name || student?.fullName || studentName || storedStudent.name || storedStudent.fullName || "Student";
    const studentId = student?.id || student?.studentId || storedStudent.id || storedStudent.studentId || "";
    const department = student?.department || storedStudent.department || "";
    const college = student?.college || storedStudent.college || "Addis Ababa Science and Technology University";

    setStudentData({
      name,
      studentId,
      department,
      college,
    });

    // Load applications to determine status
    loadApplications(studentId, name);
    
    // Load notification count
    loadNotificationCount(studentId, name);
  }, [student, studentName]);

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
        const activeApp = studentApps.find((app) => app.status === "Active" || app.status === "accepted");
        const pendingApp = studentApps.find((app) => app.status === "Pending" || app.status === "applied");
        const completedApp = studentApps.find((app) => app.status === "Completed");

        if (activeApp) {
          setInternshipStatus("Active");
        } else if (completedApp) {
          setInternshipStatus("Completed");
        } else if (pendingApp) {
          setInternshipStatus("Pending");
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
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verified Companies List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <VerifiedCompaniesList
                studentId={studentData.studentId}
                studentName={studentData.name}
                onApplicationSubmit={handleApplicationSubmit}
              />
            </div>

            {/* Self-Placement Section */}
            <SelfPlacementSection
              studentId={studentData.studentId}
              onSubmit={handleApplicationSubmit}
            />
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
