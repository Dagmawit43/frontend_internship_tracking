import React, { useState, useEffect } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../assets/aastu-logo.jpg";

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

const CompanyDashboard = () => {
  const [session, setSession] = useState({});
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

  const cName = session.companyName || session.company_name || "Company";
  const email = session.contactEmail || session.representative_email || session.email || "N/A";
  const repName = session.representative_name || session.fullName || "Representative";

  return (
    <div>
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

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{cName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome, {cName}</h1>
              <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-90 mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Email:</span>
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                  <span className="font-semibold">Representative:</span>
                  <span>{repName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10">
              <div>
                <p className="text-xs font-medium opacity-80">Role</p>
                <p className="text-sm font-bold">Company Partner</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Empty Dashboard Content */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
           <p className="text-gray-500 text-center py-8">Your dashboard is currently empty.</p>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
