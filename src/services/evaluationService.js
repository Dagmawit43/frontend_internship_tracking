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
   * GET /evaluations/advisor/for-coordinator/?internship_id=<id>
   * Coordinator (or advisor) fetches the advisor evaluation for a given InternshipApplication PK.
   */
  async getAdvisorEvaluationForInternship(internshipId) {
    try {
      const response = await api.get("/evaluations/advisor/for-coordinator/", {
        params: { internship_id: internshipId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * POST /evaluations/advisor/ — submit a new advisor evaluation.
   * @param {number} internshipId  - InternshipApplication PK
   * @param {object} body          - flat score fields already mapped to backend names
   */
  async submitAdvisorEvaluationForInternship(internshipId, body) {
    try {
      const response = await api.post("/evaluations/advisor/", body);
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

  // ── Examiner evaluations ──────────────────────────────────────────────────

  /** GET /evaluations/examiner/ — list own submitted evaluations */
  async getExaminerEvaluations() {
    try {
      const response = await api.get("/evaluations/examiner/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /students/evaluation-status/<internshipId>/ — student sees examiner progress and public evaluation status */
  async getStudentEvaluationStatus(internshipId) {
    try {
      const response = await api.get(`/students/evaluation-status/${internshipId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message,
      };
    }
  },

  /** GET /students/internship-results/<internshipId>/ — student-facing overall results when published */
  async getStudentInternshipResults(internshipId) {
    try {
      const response = await api.get(`/students/internship-results/${internshipId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/examiner/for-advisor/ — advisor sees examiner evals for their students */
  async getExaminerEvaluationsForAdvisor(params = {}) {
    try {
      const response = await api.get("/evaluations/examiner/for-advisor/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/examiner/for-student/?internship_id=<id> — student sees examiner evals for their internship */
  async getExaminerEvaluationsForStudent(params = {}) {
    try {
      const response = await api.get("/evaluations/examiner/for-student/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, status: error.response?.status, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/monthly/ — advisor sees company monthly evals for their students */
  async getAdvisorMonthlyEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/monthly/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/final-industry/ — advisor sees company final evals for their students */
  async getAdvisorFinalEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/final-industry/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** PATCH /evaluations/monthly/<id>/approve/ or /reject/ */
  async reviewMonthlyEvaluation(id, action, comment = "") {
    try {
      const url = action === "approve"
        ? `/evaluations/monthly/${id}/approve/`
        : `/evaluations/monthly/${id}/reject/`;
      const response = await api.patch(url, { comment });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** PATCH /evaluations/advisor/<id>/approve/ — advisor approves their own evaluation */
  async approveAdvisorEvaluation(id) {
    try {
      const response = await api.patch(`/evaluations/advisor/${id}/approve/`, {});
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** PATCH /evaluations/examiner/<internshipId>/overall-approval/ — examiner approves overall report */
  async approveExaminerOverallEvaluation(internshipId, slot) {
    try {
      const response = await api.patch(`/evaluations/examiner/${internshipId}/overall-approval/`, {
        slot,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/examiner/overall-queue/ — overall evaluations waiting for examiner sign-off */
  async getExaminerOverallQueue() {
    try {
      const response = await api.get(`/evaluations/examiner/overall-queue/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * POST /evaluations/examiner/ — submit or update an examiner evaluation.
   * @param {number} internshipId  - InternshipApplication PK
   * @param {object} formPayload   - full form data from ExaminerUniversityEvaluationForm
   */
  async submitExaminerEvaluation(internshipId, formPayload) {
    try {
      // Map the granular form scores to the 5 generic model fields (0–5 each)
      // using proportional scaling so the model constraints are satisfied.
      const reportTotal = formPayload.reportTotal ?? 0;
      const presentationTotal = formPayload.presentationTotal ?? 0;

      const scale = (raw, rawMax) => Math.round((raw / rawMax) * 5);

      const body = {
        internship: internshipId,
        // Map report sub-scores → report_quality_score (0–5)
        report_quality_score: scale(reportTotal, 40),
        // Map presentation sub-scores → presentation_score (0–5)
        presentation_score: scale(presentationTotal, 40),
        // Use remaining fields proportionally from finalMark
        technical_skills_score: Math.min(5, Math.round((formPayload.finalMark ?? 0) / 5)),
        communication_score: 0,
        professionalism_score: 0,
        comments: formPayload.comments || "",
        // Store the full granular data for display
        form_data: formPayload,
      };

      const response = await api.post("/evaluations/examiner/", body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/examiner/<id>/ */
  async getExaminerEvaluationById(id) {
    try {
      const response = await api.get(`/evaluations/examiner/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // ── Company evaluations ───────────────────────────────────────────────────

  /** GET /evaluations/company/monthly/?internship_id=<id> */
  async getCompanyMonthlyEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/company/monthly/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * POST /evaluations/company/monthly/ — submit or update a monthly evaluation
   * @param {number} internshipId  - InternshipApplication PK
   * @param {number} monthNumber   - 1 or 2
   * @param {object} formData      - full form payload from InternshipMonthlyEvaluation component
   */
  async submitCompanyMonthlyEvaluation(internshipId, monthNumber, formData) {
    try {
      // Map frontend form fields to backend model fields
      const sectionA = formData.sectionA || [];
      const body = {
        internship: internshipId,
        month_number: monthNumber,
        work_quality_score: Math.min(5, sectionA[0] ?? 0),
        punctuality_score: Math.min(5, sectionA[1] ?? 0),
        attitude_score: Math.min(5, sectionA[2] ?? 0),
        initiative_score: Math.min(5, sectionA[3] ?? 0),
        comments: formData.comments || "",
        form_data: formData,
      };
      const response = await api.post("/evaluations/company/monthly/", body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /** GET /evaluations/company/final/?internship_id=<id> */
  async getCompanyFinalEvaluations(params = {}) {
    try {
      const response = await api.get("/evaluations/company/final/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * POST /evaluations/company/final/ — submit or update a final evaluation
   * @param {number} internshipId  - InternshipApplication PK (backend resolves to Internship)
   * @param {object} formData      - full form payload from InternshipEvaluationForm component
   */
  async submitCompanyFinalEvaluation(internshipId, formData) {
    try {
      const sA = formData.sectionA || [];
      const sB = formData.sectionB || [];
      const body = {
        internship: internshipId,
        // Section A — Job Performance (0–5 each)
        knowledge_about_task: Math.min(5, sA[0] ?? 0),
        problem_solving: Math.min(5, sA[1] ?? 0),
        quality_of_work: Math.min(5, sA[2] ?? 0),
        punctuality_in_production: Math.min(5, sA[3] ?? 0),
        initiative: Math.min(5, sA[4] ?? 0),
        // Section B — Soft Skills (0–5 each)
        dedication: Math.min(5, sB[0] ?? 0),
        cooperation: Math.min(5, sB[1] ?? 0),
        discipline: Math.min(5, sB[2] ?? 0),
        responsibility: Math.min(5, sB[3] ?? 0),
        socialization: Math.min(5, sB[4] ?? 0),
        communication: Math.min(5, sB[5] ?? 0),
        decision_making: Math.min(5, sB[6] ?? 0),
        // Section C
        student_potential: formData.comments || "",
        overall_comments: formData.comments || "",
        would_offer_job: String(formData.jobOffer || "").toLowerCase() === "yes",
        form_data: formData,
      };
      const response = await api.post("/evaluations/company/final/", body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default evaluationService;
