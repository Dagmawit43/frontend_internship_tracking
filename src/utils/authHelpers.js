// Lightweight auth helpers — single implementation

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return safeJsonParse(json);
  } catch (e) {
    return null;
  }
}

export function getCurrentStudentId() {
  // Prefer explicit localStorage key set by authService
  try {
    const stored = localStorage.getItem('student_id');
    if (stored) return stored;
  } catch (e) {}

  // Next try the stored student object
  try {
    const raw = localStorage.getItem('student');
    const s = safeJsonParse(raw);
    if (s && s.student_id) return s.student_id;
  } catch (e) {}

  // Finally decode access token claim
  try {
    const access = localStorage.getItem('access');
    const payload = parseJwt(access);
    if (payload && payload.student_id) return payload.student_id;
  } catch (e) {}

  return null;
}

export default { getCurrentStudentId };
