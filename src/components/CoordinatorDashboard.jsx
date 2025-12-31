import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, Upload, ClipboardList } from "lucide-react";
import Sidebar from "./SideBar";
import CreateAccounts from "./CreateACcounts";
import UploadStudentList from "./UploadStudentLists";

// Dashboard Home Component

const DashboardHome = ({ stats, onStatClick }) => {

  return (

    <div>

      <div className="mb-8">

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>

        <p className="text-gray-600">Welcome to the Department Coordinator Dashboard. Manage internship assignments and user accounts.</p>

      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

            {stats.map((stat) => {

            const Icon = stat.icon;

            return (

                <div 
                  key={stat.title} 
                  onClick={() => onStatClick && onStatClick(stat.title)}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                >

                <div className="flex flex-row items-center justify-between pb-2">

                    <h3 className="text-sm font-semibold text-gray-700">{stat.title}</h3>

                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>

                    <Icon className={`w-4 h-4 ${stat.color}`} />

                    </div>

                </div>

                <div>

                    <div className="text-slate-900 mb-1 text-2xl font-bold">{stat.value}</div>

                    <p className="text-xs text-slate-500">{stat.description}</p>

                </div>

                </div>

            );

            })}

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">

            <div className="mb-4">

                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>

                <p className="text-sm text-gray-600">Latest system activities</p>

            </div>

            <div>

                <p className="text-sm text-gray-500 text-center py-4">No recent activities to display</p>

            </div>

            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">

            <div className="mb-4">

                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>

                <p className="text-sm text-gray-600">Common tasks and shortcuts</p>

            </div>

            <div>

                <div className="space-y-3">

                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left">

                    <UserCheck className="w-5 h-5 text-blue-600" />

                    <div>

                    <p className="text-sm text-slate-900">Assign Roles to Staff</p>

                    <p className="text-xs text-slate-500">Assign advisor or examiner roles</p>

                    </div>

                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left">

                    <Users className="w-5 h-5 text-green-600" />

                    <div>

                    <p className="text-sm text-slate-900">Assign Students</p>

                    <p className="text-xs text-slate-500">Match students with advisors</p>

                    </div>

                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left">

                    <Upload className="w-5 h-5 text-purple-600" />

                    <div>

                    <p className="text-sm text-slate-900">Upload Student List</p>

                    <p className="text-xs text-slate-500">Import eligible students</p>

                    </div>

                </button>

                </div>

            </div>

            </div>

        </div>

    </div>

  );

};

// Assign Students Component
const AssignStudents = () => {
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState("");
  const [selectedExaminer, setSelectedExaminer] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Get coordinator's department
  const getCoordinatorDepartment = () => {
    const activeStaff = JSON.parse(localStorage.getItem("activeStaffUser")) || {};
    return activeStaff.department || "";
  };

  const coordinatorDept = getCoordinatorDepartment();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const eligibleStudents = JSON.parse(localStorage.getItem("eligibleStudents")) || [];
    const registeredStudents = JSON.parse(localStorage.getItem("students")) || [];
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const storedAssignments = JSON.parse(localStorage.getItem("studentAssignments")) || [];

    // Filter by coordinator's department
    const deptEligibleStudents = coordinatorDept
      ? eligibleStudents.filter((s) => s.department === coordinatorDept)
      : [];
    const deptRegisteredStudents = coordinatorDept
      ? registeredStudents.filter((s) => s.department === coordinatorDept)
      : [];

    // Combine and deduplicate students
    const allDeptStudents = [...deptEligibleStudents];
    deptRegisteredStudents.forEach((rs) => {
      if (!allDeptStudents.find((s) => s.studentId === rs.studentId || s.email === rs.email)) {
        allDeptStudents.push({
          studentId: rs.studentId || rs.id,
          fullName: rs.fullName || rs.name,
          email: rs.email,
          department: rs.department,
        });
      }
    });

    const deptAdvisors = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Advisor" && u.department === coordinatorDept)
      : [];
    const deptExaminers = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Examiner" && u.department === coordinatorDept)
      : [];
    const deptAssignments = coordinatorDept
      ? storedAssignments.filter((a) => a.department === coordinatorDept)
      : [];

    setStudents(allDeptStudents);
    setAdvisors(deptAdvisors);
    setExaminers(deptExaminers);
    setAssignments(deptAssignments);
  };

  const handleAssign = () => {
    setError("");
    setSuccess("");

    if (!selectedStudent) {
      setError("Please select a student");
      return;
    }

    if (!selectedAdvisor && !selectedExaminer) {
      setError("Please select at least an advisor or examiner");
      return;
    }

    const storedAssignments = JSON.parse(localStorage.getItem("studentAssignments")) || [];
    
    // Check if assignment already exists
    const existingIndex = storedAssignments.findIndex(
      (a) =>
        (a.studentId === selectedStudent.studentId || a.email === selectedStudent.email) &&
        a.department === coordinatorDept
    );

    const assignment = {
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.fullName || selectedStudent.name,
      email: selectedStudent.email,
      department: coordinatorDept,
      advisor: selectedAdvisor || null,
      examiner: selectedExaminer || null,
      assignedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      storedAssignments[existingIndex] = assignment;
    } else {
      storedAssignments.push(assignment);
    }

    localStorage.setItem("studentAssignments", JSON.stringify(storedAssignments));
    setSuccess(`Successfully assigned ${selectedStudent.fullName || selectedStudent.name}!`);
    setSelectedStudent(null);
    setSelectedAdvisor("");
    setSelectedExaminer("");
    loadData();
    setTimeout(() => setSuccess(""), 3000);
  };

  const getAssignment = (student) => {
    return assignments.find(
      (a) =>
        (a.studentId === student.studentId || a.email === student.email) &&
        a.department === coordinatorDept
    );
  };

  if (!coordinatorDept) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Students</h2>
          <p className="text-red-600">No department assigned to your coordinator account. Please contact admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Students</h2>
        <p className="text-gray-600">
          Assign advisors and examiners to students from your department:{" "}
          <span className="font-semibold">{coordinatorDept}</span>
        </p>
      </div>

      {success && (
        <div className="bg-green-100 text-green-600 p-3 mb-4 rounded-md text-sm max-w-4xl">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-600 p-3 mb-4 rounded-md text-sm max-w-4xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Students ({students.length})</h3>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found in your department</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student, index) => {
                const assignment = getAssignment(student);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudent?.studentId === student.studentId ||
                      selectedStudent?.email === student.email
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedStudent(student);
                      const existing = getAssignment(student);
                      setSelectedAdvisor(existing?.advisor || "");
                      setSelectedExaminer(existing?.examiner || "");
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {student.fullName || student.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">{student.email || student.studentId}</p>
                      </div>
                      {assignment && (
                        <div className="text-xs">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            Assigned
                          </span>
                        </div>
                      )}
                    </div>
                    {assignment && (
                      <div className="mt-2 text-xs text-gray-600">
                        {assignment.advisor && (
                          <p>Advisor: <span className="font-medium">{assignment.advisor}</span></p>
                        )}
                        {assignment.examiner && (
                          <p>Examiner: <span className="font-medium">{assignment.examiner}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign</h3>
          {!selectedStudent ? (
            <p className="text-gray-500 text-sm">Select a student to assign advisor/examiner</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Student</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedStudent.fullName || selectedStudent.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advisor ({advisors.length} available)
                </label>
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  <option value="">Select Advisor</option>
                  {advisors.map((advisor, idx) => (
                    <option key={idx} value={advisor.username}>
                      {advisor.username} {advisor.email ? `(${advisor.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Examiner ({examiners.length} available)
                </label>
                <select
                  value={selectedExaminer}
                  onChange={(e) => setSelectedExaminer(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  <option value="">Select Examiner</option>
                  {examiners.map((examiner, idx) => (
                    <option key={idx} value={examiner.username}>
                      {examiner.username} {examiner.email ? `(${examiner.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssign}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                {getAssignment(selectedStudent) ? "Update Assignment" : "Assign"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// List View Components
const StudentsList = ({ coordinatorDept, onBack }) => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const eligibleStudents = JSON.parse(localStorage.getItem("eligibleStudents")) || [];
    const registeredStudents = JSON.parse(localStorage.getItem("students")) || [];

    const deptEligibleStudents = coordinatorDept
      ? eligibleStudents.filter((s) => s.department === coordinatorDept)
      : [];
    const deptRegisteredStudents = coordinatorDept
      ? registeredStudents.filter((s) => s.department === coordinatorDept)
      : [];

    const allDeptStudents = [...deptEligibleStudents];
    deptRegisteredStudents.forEach((rs) => {
      if (!allDeptStudents.find((s) => s.studentId === rs.studentId || s.email === rs.email)) {
        allDeptStudents.push({
          studentId: rs.studentId || rs.id,
          fullName: rs.fullName || rs.name,
          email: rs.email,
          department: rs.department,
        });
      }
    });

    setStudents(allDeptStudents);
  }, [coordinatorDept]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Students List</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Department: <span className="font-semibold">{coordinatorDept}</span> ({students.length} students)
          </p>
          {students.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No students found in your department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{student.fullName || student.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.studentId || student.id || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.department || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdvisorsList = ({ coordinatorDept, onBack }) => {
  const [advisors, setAdvisors] = useState([]);

  useEffect(() => {
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const deptAdvisors = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Advisor" && u.department === coordinatorDept)
      : [];
    setAdvisors(deptAdvisors);
  }, [coordinatorDept]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Advisors List</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Department: <span className="font-semibold">{coordinatorDept}</span> ({advisors.length} advisors)
          </p>
          {advisors.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No advisors found in your department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {advisors.map((advisor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{advisor.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{advisor.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{advisor.department || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{advisor.role || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExaminersList = ({ coordinatorDept, onBack }) => {
  const [examiners, setExaminers] = useState([]);

  useEffect(() => {
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const deptExaminers = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Examiner" && u.department === coordinatorDept)
      : [];
    setExaminers(deptExaminers);
  }, [coordinatorDept]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Examiners List</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Department: <span className="font-semibold">{coordinatorDept}</span> ({examiners.length} examiners)
          </p>
          {examiners.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No examiners found in your department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {examiners.map((examiner, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{examiner.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{examiner.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{examiner.department || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{examiner.role || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CoordinatorsList = ({ coordinatorDept, onBack }) => {
  const [coordinators, setCoordinators] = useState([]);

  useEffect(() => {
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const deptCoordinators = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Coordinator" && u.department === coordinatorDept)
      : [];
    setCoordinators(deptCoordinators);
  }, [coordinatorDept]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Coordinators List</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Department: <span className="font-semibold">{coordinatorDept}</span> ({coordinators.length} coordinators)
          </p>
          {coordinators.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No coordinators found in your department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coordinators.map((coordinator, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{coordinator.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{coordinator.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{coordinator.department || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{coordinator.role || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Component

const Settings = () => {

  return (

    <div>

      <div className="mb-8">

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>

        <p className="text-gray-600">Manage your account settings and preferences.</p>

      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">

        <p className="text-gray-600">Settings page coming soon...</p>

      </div>

    </div>

  );

};

// Main Coordinator Dashboard Component

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedListView, setSelectedListView] = useState(null);

  const [stats, setStats] = useState({

    totalStudents: 0,

    assignedStudents: 0,

    advisors: 0,

    coordinators: 0,

    examiners: 0,

  });

  // Get coordinator's department
  const getCoordinatorDepartment = () => {
    const activeStaff = JSON.parse(localStorage.getItem("activeStaffUser")) || {};
    return activeStaff.department || "";
  };

  // Load stats from localStorage (filtered by coordinator's department)
  useEffect(() => {
    const coordinatorDept = getCoordinatorDepartment();
    const eligibleStudents = JSON.parse(localStorage.getItem("eligibleStudents")) || [];
    const registeredStudents = JSON.parse(localStorage.getItem("students")) || [];
    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];
    const assignments = JSON.parse(localStorage.getItem("studentAssignments")) || [];

    // Filter by department
    const deptEligibleStudents = coordinatorDept 
      ? eligibleStudents.filter((s) => s.department === coordinatorDept)
      : [];
    const deptRegisteredStudents = coordinatorDept
      ? registeredStudents.filter((s) => s.department === coordinatorDept)
      : [];
    const deptAdvisors = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Advisor" && u.department === coordinatorDept).length
      : 0;
    const deptCoordinators = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Coordinator" && u.department === coordinatorDept).length
      : 0;
    const deptExaminers = coordinatorDept
      ? otherUsers.filter((u) => u.role === "Examiner" && u.department === coordinatorDept).length
      : 0;
    const deptAssignments = coordinatorDept
      ? assignments.filter((a) => a.department === coordinatorDept && (a.advisor || a.examiner))
      : [];
    
    // Combine eligible and registered students, deduplicate
    const allDeptStudents = [...deptEligibleStudents];
    deptRegisteredStudents.forEach((rs) => {
      if (!allDeptStudents.find((s) => s.studentId === rs.studentId || s.email === rs.email)) {
        allDeptStudents.push(rs);
      }
    });

    setStats({
      totalStudents: allDeptStudents.length,
      assignedStudents: deptAssignments.length,
      advisors: deptAdvisors,
      coordinators: deptCoordinators,
      examiners: deptExaminers,
    });
  }, [currentPage, selectedListView]); // Reload stats when page changes or list view changes

  const statsData = [

    {

      title: "Total Students",

      value: stats.totalStudents.toString(),

      description: "Eligible for internship",

      icon: Users,

      color: "text-blue-600",

      bgColor: "bg-blue-50",

    },

    {

      title: "Assigned Students",

      value: stats.assignedStudents.toString(),

      description: "With advisors & coordinators",

      icon: UserCheck,

      color: "text-green-600",

      bgColor: "bg-green-50",

    },

    {

      title: "Advisors",

      value: stats.advisors.toString(),

      description: "Active advisors",

      icon: ClipboardList,

      color: "text-purple-600",

      bgColor: "bg-purple-50",

    },

    {

      title: "Coordinators",

      value: stats.coordinators.toString(),

      description: "Active coordinators",

      icon: Upload,

      color: "text-orange-600",

      bgColor: "bg-orange-50",

    },

    {

      title: "Examiners",

      value: stats.examiners.toString(),

      description: "Active examiners",

      icon: UserCheck,

      color: "text-indigo-600",

      bgColor: "bg-indigo-50",

    },

  ];

  const coordinatorDept = getCoordinatorDepartment();

  const handleStatClick = (statTitle) => {
    setSelectedListView(statTitle);
  };

  const handleBackToList = () => {
    setSelectedListView(null);
  };

  // Reset list view when navigating away from home
  useEffect(() => {
    if (currentPage !== "home") {
      setSelectedListView(null);
    }
  }, [currentPage]);

  const renderPage = () => {
    // If a list view is selected, show it
    if (selectedListView) {
      switch (selectedListView) {
        case "Total Students":
          return <StudentsList coordinatorDept={coordinatorDept} onBack={handleBackToList} />;
        case "Advisors":
          return <AdvisorsList coordinatorDept={coordinatorDept} onBack={handleBackToList} />;
        case "Examiners":
          return <ExaminersList coordinatorDept={coordinatorDept} onBack={handleBackToList} />;
        case "Coordinators":
          return <CoordinatorsList coordinatorDept={coordinatorDept} onBack={handleBackToList} />;
        default:
          return <DashboardHome stats={statsData} onStatClick={handleStatClick} />;
      }
    }

    switch (currentPage) {

      case "home":

        return <DashboardHome stats={statsData} onStatClick={handleStatClick} />;

      case "create-accounts":

        return <CreateAccounts />;

      case "upload-list":

        return <UploadStudentList />;

      case "assign-students":

        return <AssignStudents />;

      case "settings":

        return <Settings />;

      default:

        return <DashboardHome stats={statsData} onStatClick={handleStatClick} />;

    }

  };

  const handleLogout = () => {
    // If you later store coordinator auth in localStorage, clear it here.
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
        <div className="p-6 pt-2">{renderPage()}</div>
      </div>
    </div>
  );

};

export default CoordinatorDashboard;
