/**
 * Centralized data service that loads from API instead of localStorage.
 * Replaces all mock data and localStorage-based data loading.
 */

import api from "../api";
import internshipService from "./internshipService";
import evaluationService from "./evaluationService";
import userService from "./userService";

export const dataService = {
  /**
   * Get all companies (verified)
   */
  async getCompanies(params = {}) {
    try {
      const response = await api.get("/companies/verified/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching companies:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get specific company
   */
  async getCompany(id) {
    try {
      const response = await api.get(`/companies/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all internship positions
   */
  async getInternships(params = {}) {
    try {
      const response = await api.get("/internships/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching internships:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get all applications
   */
  async getApplications(params = {}) {
    try {
      const response = await api.get("/applications/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching applications:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get all students
   */
  async getStudents(params = {}) {
    try {
      const response = await api.get("/students/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching students:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get all departments
   */
  async getDepartments(params = {}) {
    try {
      const response = await api.get("/departments/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching departments:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get monthly evaluations for current user
   */
  async getMonthlyEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/monthly/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching monthly evaluations:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get final evaluations for current user
   */
  async getFinalEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/final/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching final evaluations:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get logbook entries for internship
   */
  async getLogbookEntries(internshipId, params = {}) {
    try {
      const response = await api.get(`/internships/${internshipId}/logbook/`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching logbook entries:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Submit logbook entry
   */
  async submitLogbookEntry(internshipId, data) {
    try {
      const response = await api.post(`/internships/${internshipId}/logbook/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error submitting logbook entry:", error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get advisor for student
   */
  async getStudentAdvisor(studentId) {
    try {
      const response = await api.get(`/students/${studentId}/advisor/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching student advisor:", error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get students assigned to advisor
   */
  async getAdvisorStudents(params = {}) {
    try {
      const response = await api.get("/advisor/students/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching advisor students:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Get notifications
   */
  async getNotifications(params = {}) {
    try {
      const response = await api.get("/notifications/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/`, { read: true });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get documents for student (advisor view)
   */
  async getStudentDocuments(studentId, params = {}) {
    try {
      const response = await api.get(`/students/${studentId}/documents/`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching student documents:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Submit document decision
   */
  async submitDocumentDecision(documentId, decision, comment = "") {
    try {
      const response = await api.patch(`/documents/${documentId}/decision/`, {
        decision,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get internship statistics for dashboard
   */
  async getInternshipStats() {
    try {
      const response = await api.get("/internships/stats/");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching internship stats:", error);
      return { success: false, data: {}, error: error.response?.data || error.message };
    }
  },

  /**
   * Get overall evaluations/approvals
   */
  async getOverallEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/overall/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching overall evaluations:", error);
      return { success: false, data: [], error: error.response?.data || error.message };
    }
  },

  /**
   * Submit overall approval decision
   */
  async submitOverallDecision(internshipId, decision, comment = "") {
    try {
      const response = await api.post(`/internships/${internshipId}/overall-decision/`, {
        decision,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default dataService;
