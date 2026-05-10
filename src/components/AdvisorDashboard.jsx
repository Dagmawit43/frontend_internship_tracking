import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdvisorDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const activeSession = JSON.parse(localStorage.getItem("advisor"));
    if (!activeSession || activeSession.role !== "Advisor") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">
          Hello Advisor, welcome to your dashboard.
        </h2>
        <p>This is a placeholder for the Advisor dashboard.</p>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
