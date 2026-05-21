import api from "../api";

const internshipService = {
  /**
   * Get all active internship positions
   */
  async getInternships(params = {}) {
    try {
      const response = await api.get("/internships/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all companies
   */
  async getCompanies(params = {}) {
    try {
      const response = await api.get("/companies/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get available positions (with remaining slots)
   */
  async getAvailablePositions(params = {}) {
    try {
      const response = await api.get("/internship-positions/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get a specific internship position
   */
  async getPosition(id) {
    try {
      const response = await api.get(`/internships/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Create a new internship position (company only)
   */
  async createPosition(data) {
    try {
      const response = await api.post("/internships/", data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Update internship position (company only)
   */
  async updatePosition(id, data) {
    try {
      const response = await api.patch(`/internships/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Apply to an internship position (student)
   */
  async applyToPosition(positionId, data) {
    try {
      const response = await api.post(`/internships/${positionId}/apply/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get company applicants (mentor only)
   */
  async getCompanyApplicants(companyId) {
    try {
      const response = await api.get(`/company/${companyId}/applicants/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all applications for the current user
   */
  async getApplications(params = {}) {
    try {
      const response = await api.get("/applications/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get a specific application
   */
  async getApplication(id) {
    try {
      const response = await api.get(`/applications/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Mentor reviews application
   */
  async mentorReviewApplication(applicationId, decision, comment = "") {
    try {
      const response = await api.patch(`/applications/${applicationId}/mentor-review/`, {
        decision,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Advisor reviews application
   */
  async advisorReviewApplication(applicationId, decision, comment = "") {
    try {
      const response = await api.post(`/applications/${applicationId}/advisor-review/`, {
        decision,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Coordinator reviews application
   */
  async coordinatorReviewApplication(applicationId, decision, comment = "") {
    try {
      const response = await api.patch(`/applications/${applicationId}/dept-review/`, {
        decision,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Student accepts offer
   */
  async acceptOffer(applicationId) {
    try {
      const response = await api.post(`/applications/${applicationId}/accept-offer/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Start internship (mentor - bulk)
   */
  async startInternshipByPosition(positionId, data = {}) {
    try {
      const response = await api.post(`/internships/position/${positionId}/start/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Complete internship
   */
  async completeInternship(internshipId, data = {}) {
    try {
      const response = await api.post(`/internships/${internshipId}/complete/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Cancel internship (before start)
   */
  async cancelInternship(internshipId, reason = "") {
    try {
      const response = await api.post(`/internships/${internshipId}/cancel/`, { reason });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Add mentor notes
   */
  async addMentorNotes(internshipId, notes) {
    try {
      const response = await api.patch(`/internships/${internshipId}/notes/`, { notes });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Add advisor notes
   */
  async addAdvisorNotes(internshipId, notes, overwrite = false) {
    try {
      const response = await api.patch(`/internships/${internshipId}/advisor-notes/`, {
        notes,
        overwrite,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all internships
   */
  async getInternships(params = {}) {
    try {
      const response = await api.get("/internships/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get specific internship
   */
  async getInternship(id) {
    try {
      const response = await api.get(`/internships/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get all companies
   */
  async getCompanies(params = {}) {
    try {
      const response = await api.get("/companies/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default internshipService;
