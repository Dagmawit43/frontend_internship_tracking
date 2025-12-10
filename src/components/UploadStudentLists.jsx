import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";

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

        // Validate student structure (at minimum should have studentId or email)
        const validStudents = data.filter((student) => 
          student.studentId || student.email || student.fullName
        );

        if (validStudents.length === 0) {
          setError("No valid students found in the file");
          return;
        }

        // Store eligible students
        const existingStudents = JSON.parse(localStorage.getItem("eligibleStudents")) || [];
        const updatedStudents = [...existingStudents, ...validStudents];
        localStorage.setItem("eligibleStudents", JSON.stringify(updatedStudents));

        setSuccess(`Successfully uploaded ${validStudents.length} student(s)!`);
        setFile(null);
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
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
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
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




