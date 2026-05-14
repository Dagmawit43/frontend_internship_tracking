import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  ClipboardList,
  BookOpen,
  Upload,
} from "lucide-react";
import logoSrc from "../assets/aastu-logo.jpg";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "staff", label: "Staff list", icon: Users },
  { id: "advisors", label: "Assigned advisors", icon: UserCheck },
  { id: "examiners", label: "Assigned examiners", icon: GraduationCap },
  { id: "internships", label: "Internship approvals", icon: Briefcase },
  { id: "active-students", label: "Active interns", icon: ClipboardList },
  { id: "students", label: "Manage students", icon: BookOpen },
  { id: "upload", label: "Upload eligible list", icon: Upload },
];

const CoordinatorSidebar = ({ currentView, onNavigate, coordinatorName }) => {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:h-screen md:w-56 md:border-b-0 md:border-r md:sticky md:top-0 md:overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <img
          src={logoSrc}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200/80"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Internship Tracking</p>
          <p className="truncate text-xs text-slate-500">Coordinator</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2 md:py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`}
                aria-hidden
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <p className="truncate text-xs font-medium text-slate-500">Signed in</p>
        <p className="truncate text-sm font-semibold text-slate-800">{coordinatorName}</p>
      </div>
    </aside>
  );
};

export default CoordinatorSidebar;
