import React from "react";
import { Bell, X, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

const NotificationsDrawer = ({ isOpen, onClose, notifications = [] }) => {
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
      success: "text-green-700 bg-green-50 border-green-200",
      error: "text-red-700 bg-red-50 border-red-200",
      warning: "text-amber-700 bg-amber-50 border-amber-200",
      info: "text-indigo-700 bg-indigo-50 border-indigo-200",
    };
    return colorMap[type] || "text-slate-700 bg-slate-50 border-slate-200";
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

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[180] bg-slate-950/30 backdrop-blur-[2px]"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-[190] flex h-full w-full max-w-[24rem] flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Updates</p>
            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close notifications panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
              <Bell className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Application updates and approvals will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <article
                    key={notification.id}
                    className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${colorClass} ${notification.read ? "opacity-80" : "ring-1 ring-indigo-200"}`}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-white/70 bg-white/80 p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">{notification.title}</h4>
                          {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-hidden />}
                        </div>
                        {notification.message && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{notification.message}</p>
                        )}
                        <p className="mt-2 text-xs font-medium text-slate-500">{formatDate(notification.date)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationsDrawer;
