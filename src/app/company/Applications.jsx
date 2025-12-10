import React, { useState } from "react";
import applicationsData from "../../mock/applications.json";
import ApplicationTable from "../../components/company/ApplicationTable";
import SupervisorAssignModal from "../../components/company/SupervisorAssignModal";
import RejectModal from "../../components/company/RejectModal";
import InfoRequestModal from "../../components/company/InfoRequestModal";

const Applications = () => {
  const [applications, setApplications] = useState(applicationsData);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const openAssign = (app) => {
    setSelectedApp(app);
    setAssignModalOpen(true);
  };

  const openReject = (app) => {
    setSelectedApp(app);
    setRejectModalOpen(true);
  };

  const openInfo = (app) => {
    setSelectedApp(app);
    setInfoModalOpen(true);
  };

  const updateApp = (id, updater) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? updater(app) : app)));
  };

  const handleAssign = (supervisorName) => {
    if (!selectedApp) return;
    updateApp(selectedApp.id, (app) => ({
      ...app,
      status: "Accepted",
      supervisor: supervisorName || "Assigned Supervisor",
    }));
    setAssignModalOpen(false);
    setSelectedApp(null);
  };

  const handleReject = (reason) => {
    if (!selectedApp) return;
    updateApp(selectedApp.id, (app) => ({
      ...app,
      status: "Rejected",
      rejectionReason: reason || "Not a fit at this time",
    }));
    setRejectModalOpen(false);
    setSelectedApp(null);
  };

  const handleRequestInfo = (message) => {
    if (!selectedApp) return;
    updateApp(selectedApp.id, (app) => ({
      ...app,
      status: app.status === "Pending" ? "Pending" : app.status,
      infoRequested: message || "Requested more information",
    }));
    setInfoModalOpen(false);
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Internship Applications</h1>
        <p className="text-sm text-gray-600">Manage incoming applications and take actions.</p>
      </div>

      <ApplicationTable
        applications={applications}
        onAccept={openAssign}
        onReject={openReject}
        onRequestInfo={openInfo}
      />

      {assignModalOpen && (
        <SupervisorAssignModal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onSave={handleAssign}
        />
      )}

      {rejectModalOpen && (
        <RejectModal
          open={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onSubmit={handleReject}
        />
      )}

      {infoModalOpen && (
        <InfoRequestModal
          open={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          onSubmit={handleRequestInfo}
        />
      )}

      {/* Hosting Company Acceptance Form preview for accepted applications */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Hosting Company Acceptance Form (Preview)</h3>
        <p className="text-sm text-gray-600">This is a mock PDF preview for accepted applications.</p>
        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold">Company: ____________</p>
          <p className="font-semibold">Student: ____________</p>
          <p className="font-semibold">Industry Supervisor: ____________</p>
          <p className="mt-2 text-gray-600">Signature: _________________________</p>
        </div>
      </div>
    </div>
  );
};

export default Applications;


