import React, { useMemo } from "react";
import { Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import DashboardCard from "../../components/company/DashboardCard";
import applicationsData from "../../mock/applications.json";

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

export default Overview;


