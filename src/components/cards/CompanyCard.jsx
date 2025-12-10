import React from "react";
import { MapPin, Building2, CheckCircle, Eye } from "lucide-react";

const CompanyCard = ({ company, onViewDetails, onApply }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">
                {company.companyName}
              </h3>
            </div>
            {company.verified && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                Verified Company
              </div>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-2 mb-4">
          {company.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{company.location}</span>
            </div>
          )}
          {company.industryType && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Industry:</span> {company.industryType}
            </div>
          )}
          {company.contactEmail && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {company.contactEmail}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onViewDetails(company)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button
            onClick={() => onApply(company)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;




