import React, { useState } from "react";
import logbooksData from "../../mock/logbooks.json";
import LogbookTable from "../../components/company/LogbookTable";

const Logbooks = () => {
  const [logbooks, setLogbooks] = useState(logbooksData);

  const updateStatus = (id, status) => {
    setLogbooks((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Logbook Approvals</h1>
        <p className="text-sm text-gray-600">Approve or reject weekly student log entries.</p>
      </div>

      <LogbookTable
        logbooks={logbooks}
        onApprove={(log) => updateStatus(log.id, "Approved")}
        onReject={(log) => updateStatus(log.id, "Rejected")}
      />

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 font-semibold mb-2">Digital Signature (simulated)</p>
        <div className="border border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-400 text-sm">
          Sign here
        </div>
      </div>
    </div>
  );
};

export default Logbooks;


