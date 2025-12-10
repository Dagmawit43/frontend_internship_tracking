import React from "react";

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = "text-blue-600" }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center ${color}`}>
        {Icon ? <Icon className="w-6 h-6" /> : null}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;


