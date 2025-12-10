import React from "react";
import { Button } from "../ui/Button";

const LogbookTable = ({ logbooks, onApprove, onReject }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tasks</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Evidence</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logbooks.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                No logbook entries found
              </td>
            </tr>
          ) : (
            logbooks.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{log.student_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.date}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.tasks}</td>
                <td className="px-4 py-3 text-sm text-blue-600 underline">
                  <a href={log.evidence} target="_blank" rel="noreferrer">
                    Evidence
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  <Button variant="destructive" size="sm" onClick={() => onReject(log)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => onApprove(log)}>
                    Approve
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

export default LogbookTable;


