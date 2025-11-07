import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const StudentDashboard = () => {
  const location = useLocation();
  const { studentName } = location.state || { studentName: "Student" };
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("companies")) || [];
    const verified = stored.filter((c) => c.verified);
    setCompanies(verified);

    const apps = JSON.parse(localStorage.getItem("applications")) || [];
    setApplications(apps.filter((a) => a.studentName === studentName));
  }, [studentName]);

  const applyToCompany = (company) => {
    const apps = JSON.parse(localStorage.getItem("applications")) || [];
    const already = apps.find(
      (a) => a.companyId === company.id && a.studentName === studentName
    );
    if (already) {
      alert("You have already applied to this company.");
      return;
    }
    const newApp = {
      id: Date.now(),
      companyId: company.id,
      companyName: company.companyName,
      studentName,
      status: "applied",
      appliedAt: new Date().toISOString(),
    };
    apps.push(newApp);
    localStorage.setItem("applications", JSON.stringify(apps));
    setApplications((prev) => [...prev, newApp]);
    alert(`Applied to ${company.companyName}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Hello {studentName}</h2>
          <p className="text-gray-600">This is your student dashboard.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold mb-4">Verified Companies</h3>
          {companies.length === 0 ? (
            <p className="text-gray-600">
              No verified companies available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="p-4 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{c.companyName}</div>
                    <div className="text-sm text-gray-600">
                      {c.contactEmail || "-"} • {c.phone || "-"}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => applyToCompany(c)}
                      className="bg-blue-600 text-white py-1 px-3 rounded-md"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md mt-6">
          <h3 className="text-xl font-bold mb-3">Your Applications</h3>
          {applications.length === 0 ? (
            <p className="text-gray-600">
              You haven't applied to any company yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {applications.map((a) => (
                <li key={a.id} className="p-2 border rounded-md">
                  <div className="font-medium">{a.companyName}</div>
                  <div className="text-sm text-gray-600">
                    Status: {a.status}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
