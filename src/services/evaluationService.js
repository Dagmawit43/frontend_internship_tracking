import api from "../api";

export const evaluationService = {
  /**
   * Get monthly evaluation
   */
  async getMonthlyEvaluation(internshipId, month) {
    try {
      const response = await api.get(`/evaluations/monthly/${internshipId}/${month}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit monthly evaluation
   */
  async submitMonthlyEvaluation(internshipId, month, data) {
    try {
      const response = await api.post(`/evaluations/monthly/${internshipId}/${month}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get final evaluation
   */
  async getFinalEvaluation(internshipId) {
    try {
      const response = await api.get(`/evaluations/final/${internshipId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit final evaluation
   */
  async submitFinalEvaluation(internshipId, data) {
    try {
      const response = await api.post(`/evaluations/final/${internshipId}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get advisor evaluation
   */
  async getAdvisorEvaluation(studentId) {
    try {
      const response = await api.get(`/evaluations/advisor/${studentId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit advisor evaluation
   */
  async submitAdvisorEvaluation(studentId, data) {
    try {
      const response = await api.post(`/evaluations/advisor/${studentId}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get examiner evaluation
   */
  async getExaminerEvaluation(studentId) {
    try {
      const response = await api.get(`/evaluations/examiner/${studentId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit examiner evaluation
   */
  async submitExaminerEvaluation(studentId, data) {
    try {
      const response = await api.post(`/evaluations/examiner/${studentId}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get logbook submission
   */
  async getLogbook(internshipId, week) {
    try {
      const response = await api.get(`/logbooks/${internshipId}/${week}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit weekly logbook
   */
  async submitLogbook(internshipId, week, data) {
    try {
      const response = await api.post(`/logbooks/${internshipId}/${week}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get internship documents
   */
  async getDocuments(studentId, params = {}) {
    try {
      const response = await api.get(`/documents/student/${studentId}/`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Upload internship document
   */
  async uploadDocument(data) {
    try {
      const response = await api.post("/documents/", data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all evaluations for a student
   */
  async getStudentEvaluations(studentId, params = {}) {
    try {
      const response = await api.get(`/evaluations/student/${studentId}/`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get evaluations pending for current user
   */
  async getPendingEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/pending/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Approve/reject evaluation
   */
  async reviewEvaluation(evaluationId, status, comment = "") {
    try {
      const response = await api.patch(`/evaluations/${evaluationId}/review/`, {
        status,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default evaluationService;
