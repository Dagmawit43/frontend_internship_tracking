/**
 * Unified storage utility that tries API first, falls back to localStorage.
 * Enables gradual migration from mock data to real API.
 */

import dataService from "./dataService";
import internshipService from "./internshipService";
import evaluationService from "./evaluationService";
import userService from "./userService";

const storageCache = {};

/**
 * Get applications (try API first, fallback to localStorage)
 */
export const getApplications = async (useCache = true) => {
  const cacheKey = "applications";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getApplications();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load applications from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse applications from localStorage");
  }

  return [];
};

/**
 * Get all companies (try API first, fallback to localStorage)
 */
export const getCompanies = async (useCache = true) => {
  const cacheKey = "companies";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getCompanies();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load companies from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse companies from localStorage");
  }

  return [];
};

/**
 * Get all internships (try API first, fallback to localStorage)
 */
export const getInternships = async (useCache = true) => {
  const cacheKey = "allInternships";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await internshipService.getPositions();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load internships from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse internships from localStorage");
  }

  return [];
};

/**
 * Get all students (try API first, fallback to localStorage)
 */
export const getStudents = async (useCache = true) => {
  const cacheKey = "students";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await userService.getStudents();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load students from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse students from localStorage");
  }

  return [];
};

/**
 * Get monthly evaluations (try API first, fallback to localStorage)
 */
export const getMonthlyEvaluations = async (useCache = true) => {
  const cacheKey = "monthlyEvaluations";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getMonthlyEvaluations();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load monthly evaluations from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse monthly evaluations from localStorage");
  }

  return [];
};

/**
 * Get final evaluations (try API first, fallback to localStorage)
 */
export const getFinalEvaluations = async (useCache = true) => {
  const cacheKey = "finalEvaluations";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getFinalEvaluations();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load final evaluations from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse final evaluations from localStorage");
  }

  return [];
};

/**
 * Get logbooks (try API first, fallback to localStorage)
 */
export const getLogbooks = async (useCache = true) => {
  const cacheKey = "logbooks";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getLogbookEntries(null);
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load logbooks from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse logbooks from localStorage");
  }

  return [];
};

/**
 * Get notifications (try API first, fallback to localStorage)
 */
export const getNotifications = async (useCache = true) => {
  const cacheKey = "notifications";
  
  if (useCache && storageCache[cacheKey]) {
    return storageCache[cacheKey];
  }

  try {
    const result = await dataService.getNotifications();
    if (result.success && result.data) {
      storageCache[cacheKey] = result.data;
      localStorage.setItem(cacheKey, JSON.stringify(result.data));
      return result.data;
    }
  } catch (err) {
    console.warn("Failed to load notifications from API:", err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    console.warn("Failed to parse notifications from localStorage");
  }

  return [];
};

/**
 * Save applications to both API and localStorage
 */
export const saveApplications = (data) => {
  try {
    localStorage.setItem("applications", JSON.stringify(data));
    storageCache["applications"] = data;
  } catch (err) {
    console.error("Failed to save applications:", err);
  }
};

/**
 * Save companies to both API and localStorage
 */
export const saveCompanies = (data) => {
  try {
    localStorage.setItem("companies", JSON.stringify(data));
    storageCache["companies"] = data;
  } catch (err) {
    console.error("Failed to save companies:", err);
  }
};

/**
 * Save internships to both API and localStorage
 */
export const saveInternships = (data) => {
  try {
    localStorage.setItem("allInternships", JSON.stringify(data));
    storageCache["allInternships"] = data;
  } catch (err) {
    console.error("Failed to save internships:", err);
  }
};

/**
 * Save students to both API and localStorage
 */
export const saveStudents = (data) => {
  try {
    localStorage.setItem("students", JSON.stringify(data));
    storageCache["students"] = data;
  } catch (err) {
    console.error("Failed to save students:", err);
  }
};

/**
 * Save notifications to both API and localStorage
 */
export const saveNotifications = (data) => {
  try {
    localStorage.setItem("notifications", JSON.stringify(data));
    storageCache["notifications"] = data;
  } catch (err) {
    console.error("Failed to save notifications:", err);
  }
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  Object.keys(storageCache).forEach(key => {
    delete storageCache[key];
  });
};

/**
 * Clear specific cache entry
 */
export const clearCacheEntry = (key) => {
  delete storageCache[key];
};

export default {
  getApplications,
  getCompanies,
  getInternships,
  getStudents,
  getMonthlyEvaluations,
  getFinalEvaluations,
  getLogbooks,
  getNotifications,
  saveApplications,
  saveCompanies,
  saveInternships,
  saveStudents,
  saveNotifications,
  clearCache,
  clearCacheEntry,
};
