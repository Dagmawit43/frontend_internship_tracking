import React from "react";
import { Home, UserPlus, Upload, Users, Settings } from "lucide-react";

const Sidebar = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "create-accounts", label: "Assign Roles", icon: UserPlus },
    { id: "upload-list", label: "Upload Student List", icon: Upload },
    { id: "assign-students", label: "Assign Students", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Coordinator</h1>
        <p className="text-sm text-gray-600">Dashboard</p>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

