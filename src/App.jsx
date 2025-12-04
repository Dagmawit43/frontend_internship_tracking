import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegistrationForm from "./components/RegistrationForm";
import LoginForm from "./components/LoginForm";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CompanyDashboard from "./components/CompanyDashboard";
import CoordinatorDashboard from "./components/CoordinatorDashboard";
import AdvisorDashboard from "./components/AdvisorDashboard";
import ExaminerDashboard from "./components/ExaminerDashboard"; // <-- added Examiner
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/company-dashboard" element={<CompanyDashboard />} />
        <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
        <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
        <Route path="/examiner-dashboard" element={<ExaminerDashboard />} /> {/* <-- Examiner route */}
      </Routes>
    </Router>
  );
}

export default App;
