import React, { useState } from "react";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import logoSrc from "../../assets/aastu-logo.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="AASTU Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Internship Tracking System
              </h1>
              <p className="text-xs text-gray-500">AASTU</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
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

            {/* Profile Dropdown */}
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {studentName || "Student"}
                      </p>
                      <p className="text-xs text-gray-500">Student Account</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
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

export default TopNavigation;

