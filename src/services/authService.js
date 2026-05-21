import api from "../api";

export const authService = {
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await api.post("/auth/login/", { email, password });
      const { tokens, user } = response.data;

      if (tokens?.access) {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return { success: true, data: { tokens, user } };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Register a student
   */
  async registerStudent(data) {
    try {
      console.log("🔵 authService.registerStudent called with:", data);
      const payload = {
        department: data.department,
        student_id: data.student_id,
        user: {
          username: data.username,
          email: data.email,
          password: data.password,
          phone: data.phone,
        },
      };
      console.log("📡 Making POST request to /api/auth/student/register/ with payload:", payload);
      const response = await api.post("/auth/student/register/", payload);
      console.log("✅ Student registration response:", response.data);
      const { tokens, user } = response.data;

      if (tokens?.access) {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return { success: true, data: { tokens, user } };
    } catch (error) {
      console.error("❌ Student registration error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Register a company mentor
   */
  async registerCompany(data) {
    try {
      console.log("🔵 authService.registerCompany called with:", data);
      const payload = {
        company_name: data.company_name,
        registration_number: data.tin_number, // Assuming tin_number is registration_number
        industry_type: "Default Industry", // Add a default or get from form
        address: "Default Address", // Add a default or get from form
        contact_email: data.email,
        contact_phone: data.phone,
        website: data.website || "https://example.com", // Optional
        user: {
          username: data.username,
          email: data.email,
          password: data.password,
          phone: data.phone,
        },
      };
      console.log("📡 Making POST request to /api/auth/company/register/ with payload:", payload);
      const response = await api.post("/auth/company/register/", payload);
      console.log("✅ Company registration response:", response.data);
      const { tokens, user } = response.data;

      if (tokens?.access) {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return { success: true, data: { tokens, user } };
    } catch (error) {
      console.error("❌ Company registration error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Register staff (coordinator, advisor, examiner)
   */
  async registerStaff(data) {
    try {
      console.log("🔵 authService.registerStaff called with:", data);
      const payload = {
        email: data.email,
        username: data.username,
        password: data.password,
      };
      console.log("📡 Making POST request to /api/register/staff/ with payload:", payload);
      const response = await api.post("/register/staff/", payload);
      console.log("✅ Staff registration response:", response.data);
      const { tokens, user } = response.data;

      if (tokens?.access) {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return { success: true, data: { tokens, user } };
    } catch (error) {
      console.error("❌ Staff registration error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Verify OTP after registration
   */
  async verifyOTP(email, otp) {
    try {
      console.log("🔵 authService.verifyOTP called with:", { email, otp });
      console.log("📡 Making POST request to /api/auth/verify-otp/");
      const response = await api.post("/auth/verify-otp/", { email, otp });
      console.log("✅ OTP verification response:", response.data);
      const { tokens, user } = response.data;

      if (tokens?.access) {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return { success: true, data: { tokens, user } };
    } catch (error) {
      console.error("❌ OTP verification error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Resend OTP to email
   */
  async resendOTP(email) {
    try {
      const response = await api.post("/auth/resend-otp/", { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem("refresh");
      if (refreshToken) {
        await api.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
    }
  },

  /**
   * Request password reset link
   */
  async requestPasswordReset(email) {
    try {
      const response = await api.post("/auth/password-reset/", { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(uid, token, newPassword) {
    try {
      const response = await api.post("/auth/password-reset/confirm/", {
        uid,
        token,
        new_password: newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await api.get("/me/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(data) {
    try {
      const response = await api.patch("/me/", data);
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  /**
   * Get current stored user from localStorage
   */
  getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem("access");
  },
};

export default authService;
