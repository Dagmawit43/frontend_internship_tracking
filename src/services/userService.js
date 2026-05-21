import api from "../api";

export const userService = {
  _normalizeStaffList(raw) {
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
    return arr.map((it) => {
      const name = it.name || it.user_name || it.userName || it.fullName || it.username || "";
      const email = it.email || it.user_email || it.userEmail || it.contactEmail || it.contact_email || "";
      const department = it.department || it.department_name || it.departmentName || it.department_name || it.department_name || "";
      return {
        ...it,
        name,
        email,
        department,
      };
    });
  },
  /**
   * Get list of all users
   */
  async getUsers(params = {}) {
    try {
      const response = await api.get("/users/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get list of students
   */
  async getStudents(params = {}) {
    try {
      const response = await api.get("/students/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get advisors for a department (coordinator only)
   */
  async getAdvisors(params = {}) {
    try {
      const response = await api.get("/advisors/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Assign advisor to student (coordinator only)
   */
  async assignAdvisor(studentId, advisorId) {
    try {
      const response = await api.post(`/students/${studentId}/assign-advisor/`, {
        advisor_id: advisorId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get list of departments
   */
  async getDepartments() {
    try {
      const response = await api.get("/departments/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Create a department (admin only)
   */
  async createDepartment(data) {
    try {
      const response = await api.post("/departments/", data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get verified companies
   */
  async getVerifiedCompanies(params = {}) {
    try {
      const response = await api.get("/companies/verified/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Admin approve company
   */
  async approveCompany(companyId, comment = "") {
    try {
      const response = await api.patch(`/admin/company/${companyId}/approve/`, {
        approved: true,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Admin reject company
   */
  async rejectCompany(companyId, comment = "") {
    try {
      const response = await api.patch(`/admin/company/${companyId}/approve/`, {
        approved: false,
        comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Admin assign role
   */
  async adminAssignRole(userId, role) {
    try {
      const response = await api.post("/admin/users/admin-assign-role/", {
        user_id: userId,
        role,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Coordinator assign role
   */
  async coordinatorAssignRole(userId, role) {
    try {
      const response = await api.post("/admin/users/coordinator-assign-role/", {
        user_id: userId,
        role,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get unassigned staff (for coordinator)
   */
  async getUnassignedStaff(params = {}) {
    const candidates = [
      (p) => api.get("/advisors/unassigned/", { params: p }),
      (p) => api.get("/staff/unassigned/", { params: p }),
      (p) => api.get("/advisors/", { params: { ...p, unassigned: true } }),
    ];
    for (const attempt of candidates) {
      try {
        const response = await attempt(params);
        // If the backend returned a wrapper object (e.g., { results: [...] }) normalize
        const data = response.data && response.data.results ? response.data.results : response.data;
        return { success: true, data: this._normalizeStaffList(data) };
      } catch (error) {
        // try next
        // continue
      }
    }
    return { success: false, error: "No unassigned staff endpoint available" };
  },

  /**
   * Assign staff as advisor
   */
  async assignStaffAsAdvisor(staffId, data = {}) {
    try {
      const response = await api.post(`/students/${staffId}/assign-advisor/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Assign staff as examiner
   */
  async assignStaffAsExaminer(staffId, data = {}) {
    try {
      const response = await api.post(`/staff/${staffId}/assign-examiner/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get assigned advisors
   */
  async getAssignedAdvisors(params = {}) {
    try {
      const response = await api.get("/advisors/", { params });
      const data = response.data && response.data.results ? response.data.results : response.data;
      return { success: true, data: this._normalizeStaffList(data) };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get assigned examiners
   */
  async getAssignedExaminers(params = {}) {
    try {
      const response = await api.get("/staff/examiners/", { params });
      const data = response.data && response.data.results ? response.data.results : response.data;
      return { success: true, data: this._normalizeStaffList(data) };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get examiners for department
   */
  async getExaminers(params = {}) {
    try {
      const response = await api.get("/examiners/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default userService;
