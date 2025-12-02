import React, { useState, useEffect } from "react";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "Staff",
  });
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("view"); // 'view', 'create', 'companies', 'staff', or 'coordinator'
  const [companies, setCompanies] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Load all users from localStorage
  useEffect(() => {
    const storedStudents = JSON.parse(localStorage.getItem("students")) || [];
    const storedOtherUsers =
      JSON.parse(localStorage.getItem("otherUsers")) || [];
    // normalize students and otherUsers into a unified users array
    const studentUsers = storedStudents.map((s) => ({
      fullName: s.fullName,
      email: s.email,
      studentId: s.studentId,
      role: "Student",
    }));

    const otherUsersNorm = storedOtherUsers.map((u) => ({
      username: u.username,
      email: u.email,
      role: u.role,
    }));

    const storedCompanies = JSON.parse(localStorage.getItem("companies")) || [];
    setCompanies(storedCompanies);

    // include only verified companies in the main users list
    const verifiedCompaniesAsUsers = storedCompanies
      .filter((c) => c.verified)
      .map((c) => ({
        fullName: c.companyName,
        email: c.contactEmail,
        role: "Company",
      }));

    setUsers([...studentUsers, ...otherUsersNorm, ...verifiedCompaniesAsUsers]);
    
    // Load staff members separately
    const staffMembers = storedOtherUsers.filter((u) => u.role === "Staff");
    setStaffList(staffMembers);
  }, []);

  // Refresh staff list when staff or coordinator tab is opened
  useEffect(() => {
    if (activeTab === "staff" || activeTab === "coordinator") {
      const storedOtherUsers =
        JSON.parse(localStorage.getItem("otherUsers")) || [];
      const staffMembers = storedOtherUsers.filter((u) => u.role === "Staff");
      setStaffList(staffMembers);
    }
  }, [activeTab]);

  // Approve a company and add to users list
  const handleApproveCompany = (companyId) => {
    const stored = JSON.parse(localStorage.getItem("companies")) || [];
    const updated = stored.map((co) =>
      co.id === companyId ? { ...co, verified: true } : co
    );
    setCompanies(updated);
    localStorage.setItem("companies", JSON.stringify(updated));

    const approved = updated.find((c) => c.id === companyId);
    if (approved) {
      setUsers((prev) => [
        ...prev,
        {
          fullName: approved.companyName,
          email: approved.contactEmail,
          role: "Company",
        },
      ]);
      setSuccess(`Company ${approved.companyName} verified.`);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // Add new user
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const userToAdd = { ...newUser };
    otherUsers.push(userToAdd);
    localStorage.setItem("otherUsers", JSON.stringify(otherUsers));

    setUsers((prev) => [...prev, userToAdd]);
    setStaffList((prev) => [...prev, userToAdd]);
    setSuccess(`User ${newUser.username} created as ${newUser.role}!`);
    setNewUser({ username: "", password: "", role: "Staff" });

    setTimeout(() => setSuccess(""), 3000);
  };

  // Promote staff to coordinator
  const handlePromoteToCoordinator = (username) => {
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const updatedUsers = otherUsers.map((u) =>
      u.username === username ? { ...u, role: "Coordinator" } : u
    );
    localStorage.setItem("otherUsers", JSON.stringify(updatedUsers));

    // Update staff list
    setStaffList((prev) => prev.filter((s) => s.username !== username));

    // Update users list
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username ? { ...u, role: "Coordinator" } : u
      )
    );

    setSuccess(`Staff ${username} promoted to Coordinator!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Hello Admin, manage all users here
      </h2>

      {/* Tabs */}
      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={() => setActiveTab("view")}
          className={`py-2 px-4 rounded-md font-medium ${
            activeTab === "view" ? "bg-blue-600 text-white" : "bg-white border"
          }`}
        >
          View Users
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`py-2 px-4 rounded-md font-medium ${
            activeTab === "create"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Create User
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`py-2 px-4 rounded-md font-medium ${
            activeTab === "companies"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Verify Companies
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`py-2 px-4 rounded-md font-medium ${
            activeTab === "staff"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Staff List
        </button>
        <button
          onClick={() => setActiveTab("coordinator")}
          className={`py-2 px-4 rounded-md font-medium ${
            activeTab === "coordinator"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Create Coordinator
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "view" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4">Name / Username</th>
                <th className="py-2 px-4">Email / ID</th>
                <th className="py-2 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )}
              {users.map((user, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="py-2 px-4">
                    {user.fullName || user.username}
                  </td>
                  <td className="py-2 px-4">
                    {user.email || user.studentId || "-"}
                  </td>
                  <td className="py-2 px-4">{user.role || "Student"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "companies" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4">Company Name</th>
                <th className="py-2 px-4">Contact</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No companies found
                  </td>
                </tr>
              )}
              {companies.map((c, index) => (
                <tr
                  key={c.id || index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="py-2 px-4">{c.companyName}</td>
                  <td className="py-2 px-4">
                    {c.contactEmail || "-"} / {c.phone || "-"}
                  </td>
                  <td className="py-2 px-4">
                    {c.verified ? "Verified" : "Pending"}
                  </td>
                  <td className="py-2 px-4 space-x-2">
                    {c.documentData && (
                      <button
                        onClick={() => window.open(c.documentData, "_blank")}
                        className="bg-gray-200 py-1 px-2 rounded-md"
                      >
                        View Document
                      </button>
                    )}
                    {!c.verified && (
                      <button
                        onClick={() => handleApproveCompany(c.id)}
                        className="bg-green-600 text-white py-1 px-2 rounded-md"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "staff" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4">Username</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No staff members found
                  </td>
                </tr>
              )}
              {staffList.map((staff, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="py-2 px-4">{staff.username}</td>
                  <td className="py-2 px-4">{staff.email || "-"}</td>
                  <td className="py-2 px-4">{staff.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "coordinator" && (
        <div className="overflow-x-auto">
          {success && (
            <div className="bg-green-100 text-green-600 p-3 mb-4 rounded-md text-sm max-w-2xl mx-auto">
              {success}
            </div>
          )}
          <h3 className="text-xl font-bold mb-4 text-gray-700 text-center">
            Promote Staff to Coordinator
          </h3>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="py-2 px-4">Username</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Current Role</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No staff members available to promote
                  </td>
                </tr>
              )}
              {staffList.map((staff, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="py-2 px-4">{staff.username}</td>
                  <td className="py-2 px-4">{staff.email || "-"}</td>
                  <td className="py-2 px-4">{staff.role}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handlePromoteToCoordinator(staff.username)}
                      className="bg-purple-600 text-white py-1 px-3 rounded-md hover:bg-purple-700 transition"
                    >
                      Promote to Coordinator
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "create" && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md mt-4">
          <h3 className="text-xl font-bold mb-4 text-gray-700">
            Create New User
          </h3>

          {success && (
            <div className="bg-green-100 text-green-600 p-2 mb-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleAddUser}>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleChange}
                required
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Create User
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
