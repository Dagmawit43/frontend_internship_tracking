import api from "../api";

const assistantService = {
  /**
   * Ask a question to the RAG assistant.
   * @param {string} question
   */
  async ask(question) {
    try {
      const response = await api.post("/assistant/ask/", { question });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Upload a CV PDF for analysis and internship recommendations.
   * @param {File} file
   */
  async analyzeCV(file) {
    try {
      const formData = new FormData();
      formData.append("cv_file", file);
      const response = await api.post("/assistant/cv/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get internship recommendations by skills list.
   * @param {string[]} skills
   */
  async recommend(skills) {
    try {
      const response = await api.post("/assistant/recommend/", { skills });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Trigger knowledge base re-indexing (admin/coordinator only).
   */
  async reindex() {
    try {
      const response = await api.post("/assistant/index/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export default assistantService;
