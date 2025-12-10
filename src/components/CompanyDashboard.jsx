import React from "react";
import { Outlet } from "react-router-dom";
import CompanyDashboardLayout from "../app/company/DashboardLayout";

// Wrapper to reuse the new company dashboard layout at the legacy route /company-dashboard
const CompanyDashboard = () => {
  return (
    <CompanyDashboardLayout>
      <Outlet />
    </CompanyDashboardLayout>
  );
};

export default CompanyDashboard;
