import api from "../api";

export const attendanceService = {
  /**
   * Student check in
   */
  async checkIn(data) {
    try {
      const response = await api.post("/attendance/check-in/", data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Student check out
   */
  async checkOut(data) {
    try {
      const response = await api.post("/attendance/check-out/", data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get attendance records
   */
  async getAttendance(params = {}) {
    try {
      const response = await api.get("/attendance/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get attendance stats
   */
  async getAttendanceStats(params = {}) {
    try {
      const response = await api.get("/attendance/stats/", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(internshipId) {
    try {
      const response = await api.get(`/attendance/summary/${internshipId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default attendanceService;
