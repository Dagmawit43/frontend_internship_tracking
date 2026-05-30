import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";
import userService from "../services/userService";

const UploadStudentList = () => {
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/json" || selectedFile.name.endsWith(".json")) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please upload a JSON file");
        setFile(null);
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate that it's an array
        if (!Array.isArray(data)) {
          setError("JSON file must contain an array of students");
          return;
        }

        const validStudents = data.map((student) => ({
          studentId: String(student.studentId || student.student_id || student.id || "").trim(),
          fullName: String(student.fullName || student.full_name || student.name || "").trim(),
          email: String(student.email || "").trim(),
          department: String(student.department || "").trim(),
        }));

        if (!validStudents.every((student) => student.studentId && student.fullName && student.department)) {
          setError("JSON file must include studentId, fullName, and department for each student");
          return;
        }

        userService.uploadEligibleStudents(validStudents).then((res) => {
          if (!res.success) {
            const apiError = res.error || {};
            const message = typeof apiError === "string"
              ? apiError
              : apiError.error || apiError.detail || apiError.message || "Failed to upload eligible students.";
            setError(message);
            return;
          }

          localStorage.setItem("eligibleStudents", JSON.stringify(validStudents));
          setSuccess(`Successfully uploaded ${res.data?.count || validStudents.length} student(s)!`);
          setFile(null);
          setTimeout(() => setSuccess(""), 3000);
        }).catch((err) => {
          setError(err?.message || "Failed to upload eligible students.");
        });
      } catch {
        setError("Invalid JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Student List</h2>
        <p className="text-gray-600">Upload a JSON file containing eligible students for internship.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-2xl">
        {success && (
          <div className="bg-green-100 text-green-600 p-3 mb-4 rounded-md text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 mb-4 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Upload a JSON file with student data</p>
          
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
          >
            Select File
          </label>
          
          {file && (
            <div className="mt-4">
              <p className="text-sm text-gray-700">Selected: {file.name}</p>
              <button
                onClick={handleUpload}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Upload className="w-5 h-5" />
                Upload Students
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">Expected JSON format:</p>
          <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
{`[
  {
    "studentId": "STU001",
    "fullName": "John Doe",
    "email": "john@aastustudent.edu.et"
  },
  ...
]`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UploadStudentList;




















