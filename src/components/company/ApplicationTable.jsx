import React from "react";
import { Button } from "../ui/Button";

const statusColors = {
  Accepted: "text-green-600 bg-green-50",
  Pending: "text-yellow-600 bg-yellow-50",
  Rejected: "text-red-600 bg-red-50",
};

const ApplicationTable = ({ applications, onAccept, onReject, onRequestInfo }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CGPA</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {applications.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                No applications found
              </td>
            </tr>
          ) : (
            applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{app.student_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.cgpa}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      statusColors[app.status] || "text-gray-600 bg-gray-100"
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onRequestInfo(app)}>
                    Request Info
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onReject(app)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => onAccept(app)}>
                    Accept
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationTable;

