/**
 * Utility for loading data from API with fallback to localStorage.
 * Enables gradual migration from mock data to real API.
 */

/**
 * Load internship positions: try API first, fallback to localStorage
 */
export const loadInternships = async (internshipService, fallbackKey = "allInternships") => {
  try {
    const result = await internshipService.getPositions();
    if (result.success) {
      // Cache to localStorage for offline access
      if (result.data) {
        localStorage.setItem(fallbackKey, JSON.stringify(result.data));
      }
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load internships from API:", err);
  }

  // Fallback to localStorage
  try {
    const cached = JSON.parse(localStorage.getItem(fallbackKey) || "[]");
    if (cached && cached.length > 0) {
      return { success: true, data: cached, fromAPI: false };
    }
  } catch {
    // Ignore parse errors
  }

  return { success: false, data: [], error: "No internships available" };
};

/**
 * Load user's applications: try API first, fallback to localStorage
 */
export const loadApplications = async (internshipService, fallbackKey = "applications") => {
  try {
    const result = await internshipService.getApplications();
    if (result.success) {
      if (result.data) {
        localStorage.setItem(fallbackKey, JSON.stringify(result.data));
      }
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load applications from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(fallbackKey) || "[]");
    if (cached && cached.length > 0) {
      return { success: true, data: cached, fromAPI: false };
    }
  } catch {
    // Ignore parse errors
  }

  return { success: false, data: [], error: "No applications available" };
};

/**
 * Load students: try API first, fallback to localStorage
 */
export const loadStudents = async (userService, fallbackKey = "students") => {
  try {
    const result = await userService.getStudents();
    if (result.success) {
      if (result.data) {
        localStorage.setItem(fallbackKey, JSON.stringify(result.data));
      }
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load students from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(fallbackKey) || "[]");
    if (cached && cached.length > 0) {
      return { success: true, data: cached, fromAPI: false };
    }
  } catch {
    // Ignore parse errors
  }

  return { success: false, data: [], error: "No students available" };
};

/**
 * Load departments: try API first, fallback to constants
 */
export const loadDepartments = async (userService, fallbackDepts = []) => {
  try {
    const result = await userService.getDepartments();
    if (result.success) {
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load departments from API:", err);
  }

  if (fallbackDepts && fallbackDepts.length > 0) {
    return { success: true, data: fallbackDepts, fromAPI: false };
  }

  return { success: false, data: [], error: "No departments available" };
};

/**
 * Load evaluations for a student
 */
export const loadEvaluations = async (evaluationService, studentId) => {
  if (!studentId) {
    return { success: false, data: {}, error: "No student ID provided" };
  }

  try {
    const result = await evaluationService.getStudentEvaluations(studentId);
    if (result.success) {
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load evaluations from API:", err);
  }

  return { success: false, data: {}, error: "Failed to load evaluations" };
};

/**
 * Load user profile
 */
export const loadUserProfile = async (authService) => {
  try {
    const result = await authService.getProfile();
    if (result.success) {
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("Failed to load profile from API:", err);
  }

  // Fallback to localStorage
  try {
    const cached = JSON.parse(localStorage.getItem("user") || "null");
    if (cached) {
      return { success: true, data: cached, fromAPI: false };
    }
  } catch {
    // Ignore parse errors
  }

  return { success: false, data: null, error: "No user profile available" };
};

/**
 * Generic API call with localStorage fallback
 */
export const loadWithFallback = async (apiCall, fallbackKey, fallbackValue = null) => {
  try {
    const result = await apiCall();
    if (result.success) {
      if (result.data && fallbackKey) {
        localStorage.setItem(fallbackKey, JSON.stringify(result.data));
      }
      return { success: true, data: result.data, fromAPI: true };
    }
  } catch (err) {
    console.warn("API call failed:", err);
  }

  // Fallback
  if (fallbackKey) {
    try {
      const cached = JSON.parse(localStorage.getItem(fallbackKey) || "null");
      if (cached) {
        return { success: true, data: cached, fromAPI: false };
      }
    } catch {
      // Ignore
    }
  }

  if (fallbackValue !== null) {
    return { success: true, data: fallbackValue, fromAPI: false };
  }

  return { success: false, data: null, error: "Data not available" };
};

export default {
  loadInternships,
  loadApplications,
  loadStudents,
  loadDepartments,
  loadEvaluations,
  loadUserProfile,
  loadWithFallback,
};
