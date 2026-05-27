import api from "../api";

export const userService = {
  _normalizeStaffList(raw) {
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
    return arr.map((it) => {
      const name = it.name || it.user_name || it.userName || it.fullName || it.username || it.user_name || "";
      const email = it.email || it.user_email || it.userEmail || it.contactEmail || it.contact_email || it.user_email || "";
      const role = it.role || it.user_role || it.userRole || "";
      const department = it.department || it.department_name || it.departmentName || it.department_name || it.department_name || "";
      return {
        ...it,
        name,
        email,
        role,
        department,
        user_name: it.user_name || name,
        user_email: it.user_email || email,
        department_name: it.department_name || department,
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
   * Get eligible students (coordinator/admin)
   */
  async getEligibleStudents(params = {}) {
    try {
      const response = await api.get("/eligible-students/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Create a student record (coordinator/admin)
   */
  async createStudent(data = {}) {
    try {
      const response = await api.post(`/students/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Upload eligible students (coordinator/admin)
   */
  async uploadEligibleStudents(students = []) {
    try {
      const response = await api.post("/eligible-students/upload/", students);
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
      return { success: true, data: this._normalizeStaffList(response.data) };
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
   * Remove advisor from student (coordinator only)
   */
  async removeAdvisor(studentId) {
    try {
      const response = await api.delete(`/students/${studentId}/assign-advisor/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Assign examiner to student (coordinator only)
   */
  async assignExaminer(studentId, examinerId) {
    try {
      const response = await api.post(`/students/${studentId}/assign-examiner/`, {
        examiner_id: examinerId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Remove examiner from student (coordinator only)
   */
  async removeExaminer(studentId, examinerId = null) {
    try {
      const config = examinerId ? { data: { examiner_id: examinerId } } : {};
      const response = await api.delete(`/students/${studentId}/assign-examiner/`, config);
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
    try {
      const response = await api.get("/staff/unassigned/", { params });
      const data = response.data && response.data.results ? response.data.results : response.data;
      return { success: true, data: this._normalizeStaffList(data) };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get assigned staff
   */
  async getAssignedStaff(params = {}) {
    try {
      const response = await api.get("/staff/assigned/", { params });
      const data = response.data && response.data.results ? response.data.results : response.data;
      return { success: true, data: this._normalizeStaffList(data) };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Assign staff as advisor
   */
  async assignStaffAsAdvisor(userId, data = {}) {
    try {
      const response = await api.post("/admin/users/coordinator-assign-role/", {
        user_id: userId,
        role: "ADVISOR",
        ...data,
      });
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
      const response = await api.post("/admin/users/coordinator-assign-role/", {
        user_id: staffId,
        role: "EXAMINER",
        ...data,
      });
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
      const assigned = await this.getAssignedStaff(params);
      if (!assigned.success) return assigned;
      return {
        success: true,
        data: assigned.data.filter((item) => String(item.role || "").toUpperCase() === "ADVISOR"),
      };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get assigned examiners
   */
  async getAssignedExaminers(params = {}) {
    try {
      const assigned = await this.getAssignedStaff(params);
      if (!assigned.success) return assigned;
      return {
        success: true,
        data: assigned.data.filter((item) => String(item.role || "").toUpperCase() === "EXAMINER"),
      };
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
      return { success: true, data: this._normalizeStaffList(response.data) };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Mark staff as unassigned
   */
  async unassignStaff(staffId, params = {}) {
    try {
      const response = await api.post(`/staff/${staffId}/unassign/`, {}, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default userService;
