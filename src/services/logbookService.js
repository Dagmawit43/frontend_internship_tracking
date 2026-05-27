import api from "../api";

const logbookService = {
  async getMyLogbooks() {
    try {
      const res = await api.get(`/logbooks/my/`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  },

  async getLogbooksForStudent(studentId) {
    try {
      if (!studentId) return { success: false, error: "missing studentId" };
      // Prefer explicit query param if backend exposes it
      const res = await api.get(`/logbooks/?student_id=${encodeURIComponent(studentId)}`);
      return { success: true, data: res.data };
    } catch (err) {
      // Fallback to /logbooks/my/ which may return context-aware entries for other roles
      try {
        const fallback = await api.get(`/logbooks/my/`);
        return { success: true, data: fallback.data };
      } catch {
        return { success: false, error: err?.response?.data || err?.message || String(err) };
      }
    }
  },

  async submitLogbook(logbookId) {
    try {
      const res = await api.post(`/logbooks/${logbookId}/submit/`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  },

  async verifyLogbook(logbookId, payload = {}) {
    try {
      const res = await api.post(`/logbooks/${logbookId}/verify/`, payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  },

  async reviewLogbook(logbookId, payload = {}) {
    try {
      const res = await api.post(`/logbooks/${logbookId}/review/`, payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  },
};

export default logbookService;
