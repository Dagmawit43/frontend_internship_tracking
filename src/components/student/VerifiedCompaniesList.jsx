import React, { useState, useEffect } from "react";
import CompanyCard from "../cards/CompanyCard";
import ApplicationModal from "../modals/ApplicationModal";
import { Building2, Loader2 } from "lucide-react";

const VerifiedCompaniesList = ({ studentId, studentName, onApplicationSubmit }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("companies")) || [];
      const verified = stored.filter((c) => c.verified === true);
      setCompanies(verified);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleApply = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleApplicationSubmit = async (applicationData) => {
    try {
      const applications = JSON.parse(localStorage.getItem("applications")) || [];
      
      // Check if already applied
      const existing = applications.find(
        (app) =>
          (app.studentId === studentId || app.studentName === studentName) &&
          app.companyId === applicationData.companyId
      );

      if (existing) {
        alert("You have already applied to this company.");
        return;
      }

      const newApplication = {
        id: Date.now(),
        ...applicationData,
        studentId,
        studentName,
        status: "Pending",
        appliedAt: new Date().toISOString(),
      };

      applications.push(newApplication);
      localStorage.setItem("applications", JSON.stringify(applications));

      // Create notification
      const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
      notifications.push({
        id: Date.now(),
        type: "info",
        title: `Application submitted to ${applicationData.companyName}`,
        message: "Your application is pending review",
        date: new Date().toISOString(),
        studentId,
        studentName,
      });
      localStorage.setItem("notifications", JSON.stringify(notifications));

      if (onApplicationSubmit) {
        onApplicationSubmit(newApplication);
      }

      alert(`Successfully applied to ${applicationData.companyName}!`);
      loadCompanies(); // Refresh list
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Verified Companies
          </h2>
          <p className="text-gray-600">
            Browse and apply to verified internship opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } transition-colors`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } transition-colors`}
          >
            List
          </button>
        </div>
      </div>

      {/* Companies Grid/List */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Verified Companies Available
          </h3>
          <p className="text-gray-600">
            There are no verified companies at the moment. Check back later.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onViewDetails={handleViewDetails}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {/* Application Modal */}
      {selectedCompany && (
        <ApplicationModal
          company={selectedCompany}
          studentId={studentId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

export default VerifiedCompaniesList;

