import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const NotificationsPanel = ({ studentId, studentName }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load notifications from localStorage
    const allNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const studentNotifications = allNotifications
      .filter((n) => n.studentId === studentId || n.studentName === studentName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); // Show latest 10

    setNotifications(studentNotifications);

    // Also check applications for status updates
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const studentApps = applications.filter(
      (app) => app.studentId === studentId || app.studentName === studentName
    );

    // Generate notifications from application status changes
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

    // Merge and deduplicate
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

export default NotificationsPanel;

