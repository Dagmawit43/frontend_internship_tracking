import React from "react";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

const WelcomeHeader = ({ studentName, department, college, internshipStatus }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      "Not Applied": {
        icon: AlertCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300",
      },
      Pending: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
      },
      Active: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
      },
      Completed: {
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
      },
    };
    return statusMap[status] || statusMap["Not Applied"];
  };

  const statusConfig = getStatusConfig(internshipStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome, {studentName || "Student"}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm md:text-base">
            {department && (
              <div className="flex items-center gap-2">
                <span className="opacity-90">Department:</span>
                <span className="font-semibold">{department}</span>
              </div>
            )}
            {college && (
              <div className="flex items-center gap-2">
                <span className="opacity-90">College:</span>
                <span className="font-semibold">{college}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}
        >
          <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
          <div>
            <p className={`text-xs font-medium ${statusConfig.color} opacity-70`}>
              Internship Status
            </p>
            <p className={`text-sm font-bold ${statusConfig.color}`}>
              {internshipStatus || "Not Applied"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;

