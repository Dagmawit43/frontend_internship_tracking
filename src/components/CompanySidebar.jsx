import React from "react";
import { LayoutDashboard, Briefcase, Users, GraduationCap } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Overview", icon: LayoutDashboard },
  { id: "internships", label: "Internships", icon: Briefcase },
  { id: "applications", label: "Applied students", icon: Users },
  { id: "interns", label: "Active interns", icon: GraduationCap },
];

const CompanySidebar = ({ currentView, onNavigate, companyName }) => {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:w-56 md:min-h-0 md:self-stretch md:border-b-0 md:border-r md:border-slate-200">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3 md:pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu</p>
      </div>
      <nav className="flex min-h-0 flex-row gap-1 overflow-x-auto px-2 py-2 scrollbar-hide md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-2 md:py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors md:w-full md:gap-3 ${
                active
                  ? "bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`}
                aria-hidden
              />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto shrink-0 border-t border-slate-100 p-3">
        <p className="truncate text-xs font-medium text-slate-500">Signed in</p>
        <p className="truncate text-sm font-semibold text-slate-800">{companyName || "Company"}</p>
      </div>
    </aside>
  );
};

export default CompanySidebar;
