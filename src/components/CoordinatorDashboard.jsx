import React, { useState, useEffect } from "react";

import { Users, UserCheck, Upload, ClipboardList } from "lucide-react";

import Sidebar from "./SideBar";

import CreateAccounts from "./CreateACcounts";

import UploadStudentList from "./UploadStudentLists";

// Dashboard Home Component

const DashboardHome = ({ stats }) => {

  return (

    <div>

      <div className="mb-8">

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>

        <p className="text-gray-600">Welcome to the Department Coordinator Dashboard. Manage internship assignments and user accounts.</p>

      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {stats.map((stat) => {

            const Icon = stat.icon;

            return (

                <div key={stat.title} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">

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

  const [currentPage, setCurrentPage] = useState("home");

  const [stats, setStats] = useState({

    totalStudents: 0,

    assignedStudents: 0,

    advisors: 0,

    coordinators: 0,

  });

  // Load stats from localStorage

  useEffect(() => {

    const eligibleStudents = JSON.parse(localStorage.getItem("eligibleStudents")) || [];

    const otherUsers = JSON.parse(localStorage.getItem("otherUsers")) || [];

    const assignments = JSON.parse(localStorage.getItem("studentAssignments")) || [];

    const advisors = otherUsers.filter((u) => u.role === "Advisor").length;

    const coordinators = otherUsers.filter((u) => u.role === "Coordinator").length;

    const assignedCount = assignments.filter(

      (a) => (a.advisor || a.coordinator)

    ).length;

    setStats({

      totalStudents: eligibleStudents.length,

      assignedStudents: assignedCount,

      advisors: advisors,

      coordinators: coordinators,

    });

  }, [currentPage]); // Reload stats when page changes

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

  ];

  const renderPage = () => {

    switch (currentPage) {

      case "home":

        return <DashboardHome stats={statsData} />;

      case "create-accounts":

        return <CreateAccounts />;

      case "upload-list":

        return <UploadStudentList />;

      case "assign-students":

        return (

          <div>

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Students</h2>

              <p className="text-gray-600">Assign students feature coming soon...</p>

            </div>

          </div>

        );

      case "settings":

        return <Settings />;

      default:

        return <DashboardHome stats={statsData} />;

    }

  };

  return (

    <div className="flex h-screen bg-gray-100">

      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="flex-1 overflow-y-auto">

        <div className="p-6">{renderPage()}</div>

      </div>

    </div>

  );

};

export default CoordinatorDashboard;
