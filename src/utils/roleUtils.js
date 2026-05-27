/**
 * Canonical role names used throughout the frontend.
 * The backend returns uppercase ("ADVISOR"), the frontend uses title case ("Advisor").
 */
export const ROLES = {
  STUDENT: "Student",
  ADVISOR: "Advisor",
  COORDINATOR: "Coordinator",
  EXAMINER: "Examiner",
  COMPANY: "Company",
  ADMIN: "Admin",
  STAFF: "Staff",
};

const ROLE_MAP = {
  student: "Student",
  advisor: "Advisor",
  coordinator: "Coordinator",
  examiner: "Examiner",
  company: "Company",
  admin: "Admin",
  staff: "Staff",
  evaluator: "Examiner", // legacy alias
};

/**
 * Normalize any role string to title-case canonical form.
 * "ADVISOR" → "Advisor", "advisor" → "Advisor", "Advisor" → "Advisor"
 */
export const normalizeRole = (value) =>
  ROLE_MAP[String(value || "").trim().toLowerCase()] || String(value || "").trim();

/**
 * Case-insensitive role check.
 * isRole(user.role, "Advisor") works for "ADVISOR", "advisor", "Advisor"
 */
export const isRole = (roleValue, expected) =>
  String(roleValue || "").trim().toLowerCase() === String(expected || "").trim().toLowerCase();
