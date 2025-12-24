import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import applicationsData from "../mock/applications.json";
import logbooksData from "../mock/logbooks.json";
import monthlyData from "../mock/monthlyEvaluations.json";
import finalData from "../mock/finalCompanyEvaluations.json";
import { Button } from "./ui/Button";

// Small reusable card for overview stats
const DashboardCard = ({ title, value, subtitle, icon: Icon, color = "text-blue-600" }) => (
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

// Overview content
const Overview = () => {
  const stats = useMemo(() => {
    const total = applicationsData.length;
    const accepted = applicationsData.filter((a) => a.status === "Accepted").length;
    const pending = applicationsData.filter((a) => a.status === "Pending").length;
    const rejected = applicationsData.filter((a) => a.status === "Rejected").length;
    return { total, accepted, pending, rejected };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600 text-sm">Summary of internship applications.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Applications" value={stats.total} icon={Briefcase} />
        <DashboardCard title="Accepted" value={stats.accepted} icon={CheckCircle} color="text-green-600" />
        <DashboardCard title="Pending" value={stats.pending} icon={Clock} color="text-yellow-600" />
        <DashboardCard title="Rejected" value={stats.rejected} icon={XCircle} color="text-red-600" />
      </div>
    </div>
  );
};

// Shared evaluation form used in Monthly page
const EvaluationForm = ({ title, fields, values, onChange, onSubmit, submitLabel = "Submit" }) => {
  const total = useMemo(() => {
    const scores = Object.values(values || {}).map((v) => Number(v) || 0);
    return scores.reduce((sum, v) => sum + v, 0);
  }, [values]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Adjust ratings; score is calculated locally.</p>
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-800">{field.label}</label>
              <span className="text-sm text-gray-600">{values[field.name] ?? 0}/5</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={values[field.name] ?? 0}
              onChange={(e) => onChange(field.name, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-700">
          Monthly Score: <span className="font-semibold text-gray-900">{total}</span>
        </div>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
};

// Modals and tables used in Applications / Logbooks
const SupervisorAssignModal = ({ open, onClose, onSave }) => {
  const [supervisor, setSupervisor] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Assign Industry Supervisor</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Supervisor Name</label>
          <input
            type="text"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter supervisor full name"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(supervisor);
              setSupervisor("");
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a short reason"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onSubmit(reason);
              setReason("");
            }}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoRequestModal = ({ open, onClose, onSubmit }) => {
  const [message, setMessage] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Request More Information</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Message</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What additional details do you need?"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(message);
              setMessage("");
            }}
          >
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
};

const statusColors = {
  Accepted: "text-green-600 bg-green-50",
  Pending: "text-yellow-600 bg-yellow-50",
  Rejected: "text-red-600 bg-red-50",
};

const ApplicationTable = ({ applications, onAccept, onReject, onRequestInfo }) => (
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

const LogbookTable = ({ logbooks, onApprove, onReject }) => (
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

// Section components that use the above helpers
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

const monthlyFields = [
  { name: "technical", label: "Technical Skills" },
  { name: "communication", label: "Communication" },
  { name: "professionalism", label: "Professionalism" },
  { name: "timeliness", label: "Timeliness" },
];

const Monthly = () => {
  const [evaluations, setEvaluations] = useState(monthlyData);
  const [form, setForm] = useState({
    student_name: "",
    month: "February",
    technical: 3,
    communication: 3,
    professionalism: 3,
    timeliness: 3,
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const total = Object.values(form)
      .filter((v) => typeof v === "number")
      .reduce((sum, v) => sum + v, 0);

    const record = { id: `me-${Date.now()}`, ...form, total };
    setEvaluations((prev) => [record, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Evaluations</h1>
        <p className="text-sm text-gray-600">Capture monthly evaluation scores.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Name</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.student_name}
              onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
              placeholder="Enter student name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Month</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.month}
              onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
            />
          </div>
        </div>
        <EvaluationForm
          title="Monthly Rating"
          fields={monthlyFields}
          values={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Save Evaluation"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Monthly Evaluations</h3>
        <div className="divide-y divide-gray-200">
          {evaluations.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No evaluations yet.</p>
          ) : (
            evaluations.map((ev) => (
              <div key={ev.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ev.student_name}</p>
                  <p className="text-xs text-gray-500">Month: {ev.month}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">Total: {ev.total}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FinalEvaluation = () => {
  const [evaluations, setEvaluations] = useState(finalData);
  const [locked, setLocked] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    technical: "",
    communication: "",
    professionalism: "",
    recommendation: false,
    letter: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const score =
      Number(form.technical || 0) + Number(form.communication || 0) + Number(form.professionalism || 0);
    const record = {
      id: `fe-${Date.now()}`,
      student_name: form.student_name,
      score,
      recommendation: form.recommendation,
      locked: true,
    };
    setEvaluations((prev) => [record, ...prev]);
    setLocked(true);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, letter: file.name }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Final Evaluation (40%)</h1>
        <p className="text-sm text-gray-600">Submit the final company evaluation. Form locks after submit.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Name</label>
            <input
              disabled={locked}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.student_name}
              onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recommendation Letter (optional)</label>
            <input type="file" disabled={locked} onChange={handleFile} className="w-full" />
            {form.letter && <p className="text-xs text-gray-500">Uploaded: {form.letter}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["technical", "communication", "professionalism"].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
              <input
                type="number"
                min={0}
                max={40}
                disabled={locked}
                value={form[field]}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={locked}
            checked={form.recommendation}
            onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.checked }))}
          />
          <span className="text-sm text-gray-700">Recommend this student</span>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={locked}>
            {locked ? "Form Locked" : "Submit Final Evaluation"}
          </Button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Final Evaluations</h3>
        <div className="divide-y divide-gray-200">
          {evaluations.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No final evaluations yet.</p>
          ) : (
            evaluations.map((ev) => (
              <div key={ev.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ev.student_name}</p>
                  <p className="text-xs text-gray-500">Score: {ev.score}</p>
                </div>
                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                  {ev.recommendation ? "Recommended" : "Not Recommended"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "applications", label: "Internship Applications" },
  { id: "logbooks", label: "Weekly Logbook Approvals" },
  { id: "monthly", label: "Monthly Evaluations" },
  { id: "final", label: "Final Evaluation Form" },
];

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const company = useMemo(() => {
    const fromCompany = JSON.parse(localStorage.getItem("activeCompany") || "null");
    const fromUser = JSON.parse(localStorage.getItem("activeCompanyUser") || "null");
    return fromCompany || fromUser;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("activeCompanyUser");
    navigate("/");
  };

  useEffect(() => {
    if (!company) {
      navigate("/company/login");
    } else {
      setLoading(false);
    }
  }, [company, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-sm">Loading company dashboard...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "applications":
        return <Applications />;
      case "logbooks":
        return <Logbooks />;
      case "monthly":
        return <Monthly />;
      case "final":
        return <FinalEvaluation />;
      case "overview":
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
          <div className="px-6 py-5 border-b border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold">Company Dashboard</p>
            <p className="text-lg font-bold text-gray-900">{company.company_name}</p>
          </div>
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900">{company.company_name}</span>
              <span className="text-sm text-gray-500">({company.location})</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </header>

          <main className="p-4 md:p-6">{renderContent()}</main>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
