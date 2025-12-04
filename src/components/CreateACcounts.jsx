import React, { useState, useEffect } from "react";
import { UserCheck, Users } from "lucide-react";

const CreateAccounts = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedRole, setSelectedRole] = useState("Advisor");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Get coordinator's department
  const getCoordinatorDepartment = () => {
    const activeStaff = JSON.parse(localStorage.getItem("activeStaffUser")) || {};
    return activeStaff.department || "";
  };

  // Load staff members (only those with role "Staff" from coordinator's department)
  useEffect(() => {
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const coordinatorDept = getCoordinatorDepartment();
    const staffMembers = otherUsers.filter(
      (u) => u.role === "Staff" && u.department === coordinatorDept
    );
    setStaffList(staffMembers);
  }, [success]); // Reload when role is assigned

  const handleAssignRole = () => {
    setError("");
    setSuccess("");

    if (!selectedStaff) {
      setError("Please select a staff member");
      return;
    }

    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const updatedUsers = otherUsers.map((u) =>
      u.username === selectedStaff ? { ...u, role: selectedRole } : u
    );
    localStorage.setItem("otherUsers", JSON.stringify(updatedUsers));

    // Update staff list
    const updatedStaff = staffList.filter((s) => s.username !== selectedStaff);
    setStaffList(updatedStaff);

    setSuccess(`Staff member assigned as ${selectedRole} successfully!`);
    setSelectedStaff("");
    setSelectedRole("Advisor");

    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Roles to Staff</h2>
        <p className="text-gray-600">
          Assign roles (Advisor or Examiner) to staff members from your department:{" "}
          <span className="font-semibold">{getCoordinatorDepartment() || "Not assigned"}</span>
        </p>
      </div>

      {success && (
        <div className="bg-green-100 text-green-600 p-3 mb-4 rounded-md text-sm max-w-2xl">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-600 p-3 mb-4 rounded-md text-sm max-w-2xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff List */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Staff Members
            </h3>
            <p className="text-sm text-gray-600">
              Staff members created by admin (without assigned roles)
            </p>
          </div>

          {staffList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No staff members available</p>
              <p className="text-sm text-gray-400 mt-2">
                Admin needs to create staff accounts first
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {staffList.map((staff, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStaff === staff.username
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedStaff(staff.username)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{staff.username}</p>
                      {staff.email && (
                        <p className="text-sm text-gray-500">{staff.email}</p>
                      )}
                      {staff.department && (
                        <p className="text-xs text-blue-600 mt-1">{staff.department}</p>
                      )}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Staff
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Assignment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Assign Role
            </h3>
            <p className="text-sm text-gray-600">
              Select a staff member and assign them a role
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Selected Staff Member
              </label>
              <input
                type="text"
                value={
                  selectedStaff
                    ? staffList.find((s) => s.username === selectedStaff)?.username || ""
                    : ""
                }
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600"
                placeholder="Select a staff member from the list"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Assign Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedStaff}
              >
                <option value="Advisor">Advisor</option>
                <option value="Examiner">Examiner</option>
              </select>
            </div>

            <button
              onClick={handleAssignRole}
              disabled={!selectedStaff}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-5 h-5" />
              Assign Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccounts;
