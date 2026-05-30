import api from "../api";

const internshipService = {
  /**
   * Get all active internship positions
   */
  async getPositions(userId, params = {}) {
    if (userId) {
      try {
        const response = await api.get(`/internships/${userId}/`, { params });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.response?.data || error.message };
      }
    }

    return this.getAvailablePositions(params);
  },

  /**
   * Get all active internship positions (legacy alias used by shared loaders)
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
  async getPosition(userId, id) {
    try {
      const response = await api.get(`/internships/${userId}/detail/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Create a new internship position (company only)
   */
  async createPosition(userId, data) {
    try {
      const response = await api.post(`/internships/${userId}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Update internship position (company only)
   */
  async updatePosition(userId, id, data) {
    try {
      const response = await api.patch(`/internships/${userId}/detail/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Delete internship position (company only)
   */
  async deletePosition(userId, id) {
    try {
      const response = await api.delete(`/internships/${userId}/detail/${id}/`);
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
      const config = data instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined;
      const response = await api.post(`/internships/${positionId}/apply/`, data, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get company applicants (mentor only)
   * @param {number} companyId - the company's database ID
   * @param {object} params - optional query filters (dept_status, mentor_status, etc.)
   */
  async getCompanyApplicants(companyId, params = {}) {
    try {
      const response = await api.get(`/company/${companyId}/applicants/`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get internship records for the current company.
   */
  async getInternshipRecords(params = {}) {
    try {
      const response = await api.get("/internship-records/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get applications that have been approved by the department (coordinator view)
   */
  async getApprovedApplications(params = {}) {
    try {
      const response = await api.get("/applications/approved/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // ── Logbook endpoints ──────────────────────────────────────────────────

  /** Student: get own logbooks */
  async getMyLogbooks() {
    try {
      const response = await api.get("/logbooks/my/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Student: get own internship supporting documents */
  async getMyDocuments(params = {}) {
    try {
      const response = await api.get("/documents/my/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Advisor: get student internship documents for assigned internships */
  async getAdvisorDocuments(params = {}) {
    try {
      const response = await api.get("/documents/advisor/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Examiner: get student internship documents for assigned internships */
  async getExaminerDocuments(params = {}) {
    try {
      const response = await api.get("/documents/examiner/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Student: upload internship supporting document */
  async uploadMyDocument({ internshipId, title, description, file }) {
    try {
      const formData = new FormData();
      if (internshipId) formData.append("internship_id", internshipId);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);
      formData.append("file", file);

      const response = await api.post("/documents/my/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Advisor: review a student's uploaded document */
  async advisorReviewDocument(documentId, action, comment = "") {
    try {
      const response = await api.post(`/documents/${documentId}/advisor-review/`, {
        action,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Examiner: review a student's uploaded document */
  async examinerReviewDocument(documentId, action, comment = "") {
    try {
      const response = await api.post(`/documents/${documentId}/examiner-review/`, {
        action,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Advisor: get all logbooks for assigned students */
  async getAdvisorLogbooks(params = {}) {
    try {
      const response = await api.get("/logbooks/advisor/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Company: get all logbooks for company interns */
  async getCompanyLogbooks(params = {}) {
    try {
      const response = await api.get("/logbooks/company/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Student: create a new weekly logbook */
  async createLogbook(weekNumber, internshipId = null) {
    try {
      const body = { week_number: weekNumber };
      if (internshipId) body.internship_id = internshipId;
      const response = await api.post("/logbooks/", body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Student: add a daily entry to a logbook */
  async addLogbookEntry(logbookId, entry) {
    try {
      const response = await api.post(`/logbooks/${logbookId}/entries/`, entry);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Student: submit a logbook week for company review */
  async submitLogbook(logbookId, studentComment = "") {
    try {
      const response = await api.post(`/logbooks/${logbookId}/submit/`, { student_comment: studentComment });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Company: verify (approve/reject) a submitted logbook */
  async verifyLogbook(logbookId, action, comment = "") {
    try {
      const response = await api.post(`/logbooks/${logbookId}/verify/`, { action, comment });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** Advisor: review (approve/reject) a verified logbook */
  async reviewLogbook(logbookId, action, comment = "") {
    try {
      const response = await api.post(`/logbooks/${logbookId}/review/`, { action, comment });
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
   * Get the current student's applications
   */
  async getMyApplications(params = {}) {
    try {
      const response = await api.get("/applications/my/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get the current student's self-placement request.
   */
  async getSelfPlacementRequest() {
    try {
      const response = await api.get("/self-placement/request/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Submit a self-placement request.
   */
  async submitSelfPlacementRequest(formData) {
    try {
      const response = await api.post("/self-placement/request/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get the current placement for the logged-in student.
   */
  async getCurrentPlacement() {
    try {
      const response = await api.get("/students/me/current-placement/");
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

    /** Coordinator: approve/reject overall evaluation (backend) */
    async coordinatorApproveOverall(internshipId, action = "approve", comment = "") {
      try {
        const response = await api.patch(`/coordinator/overall-evaluation/${internshipId}/approve/`, {
          action,
          comment,
        });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.response?.data || error.message };
      }
    },

  /**
   * Mentor reviews application
   */
  async mentorReviewApplication(applicationId, action, signature = "", rejection_reason = "") {
    try {
      const response = await api.patch(`/applications/${applicationId}/mentor-review/`, {
        action,
        signature,
        rejection_reason,
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
  async coordinatorReviewApplication(applicationId, action, signature = "") {
    try {
      const response = await api.patch(`/applications/${applicationId}/dept-review/`, {
        action,
        signature,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Coordinator reviews a self-placement request
   */
  async reviewSelfPlacementRequest(requestId, action, review_notes = "") {
    try {
      const response = await api.patch(`/self-placement/request/${requestId}/review/`, {
        action,
        review_notes,
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
