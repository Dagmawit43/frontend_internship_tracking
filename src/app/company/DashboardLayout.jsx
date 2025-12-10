import React, { useMemo } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

const navItems = [
  { to: "/company/dashboard", label: "Overview" },
  { to: "/company/dashboard/applications", label: "Internship Applications" },
  { to: "/company/dashboard/logbooks", label: "Weekly Logbook Approvals" },
  { to: "/company/dashboard/monthly", label: "Monthly Evaluations" },
  { to: "/company/dashboard/final-evaluation", label: "Final Evaluation Form" },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const company = useMemo(() => JSON.parse(localStorage.getItem("activeCompany") || "null"), []);

  const handleLogout = () => {
    localStorage.removeItem("activeCompany");
    navigate("/company/login");
  };

  if (!company) {
    navigate("/company/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
          <div className="px-6 py-5 border-b border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold">Company Dashboard</p>
            <p className="text-lg font-bold text-gray-900">{company.company_name}</p>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/company/dashboard" className="text-lg font-bold text-gray-900">
                {company.company_name}
              </Link>
              <span className="text-sm text-gray-500">({company.location})</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </header>

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

