import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TopNavigation from "./student/TopNavigation";
import WelcomeHeader from "./student/WelcomeHeader";
import VerifiedCompaniesList from "./student/VerifiedCompaniesList";
import SelfPlacementSection from "./student/SelfPlacementSection";
import NotificationsPanel from "./student/NotificationsPanel";

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
