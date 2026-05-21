# API Integration Guide

## Overview
The internship tracking frontend has been integrated with a Django REST backend API. All API calls go through a service layer that handles authentication, error handling, and token management.

## Architecture

### Service Layer (`src/services/`)
Each service module handles a specific domain:
- `authService.js` - Authentication & user profile
- `internshipService.js` - Positions, applications, internship lifecycle
- `userService.js` - Users, departments, companies, roles
- `attendanceService.js` - Check-in/out operations
- `evaluationService.js` - Evaluations, logbooks, documents

### Pattern
All service methods return:
```javascript
{
  success: true|false,
  data: {}, // or null if error
  error: {} // or null if success
}
```

### Example Usage
```javascript
import internshipService from '../services/internshipService';

// Fetch positions
const result = await internshipService.getPositions();
if (result.success) {
  console.log('Positions:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Authentication Flow

### Login
1. User enters email and password in LoginForm
2. LoginForm calls `authService.login(email, password)`
3. Service posts to `/api/auth/login/`
4. Backend returns tokens and user data
5. Tokens stored in localStorage (access, refresh)
6. User redirected to appropriate dashboard

### Token Refresh
- Automatic on 401 response via axios interceptor
- Old token replaced with new one
- Request retried automatically
- Transparent to the rest of the app

### Logout
- `authService.logout()` posts to `/api/auth/logout/`
- Tokens cleared from localStorage
- User redirected to login page

## Key Files

### Environment Variables
`.env` file (not in git):
```
VITE_API_BASE_URL=https://internship-tracker-backend-ycc5.onrender.com/api
VITE_API_TIMEOUT=70000
```

### Configuration
- `src/api.js` - Axios instance with interceptors
- `src/contexts/AuthContext.jsx` - Auth state & methods
- `src/services/*` - Domain-specific services

### Components
- `src/components/LoginForm.jsx` - Login page (✅ uses API)
- `src/components/RegistrationForm.jsx` - Registration (TODO: use API)
- `src/components/StudentDashboard.jsx` - Student dashboard (TODO: full API)
- `src/components/CompanyDashboard.jsx` - Company dashboard (TODO: full API)
- `src/components/CoordinatorDashboard.jsx` - Coordinator dashboard (TODO: full API)
- `src/components/AdvisorDashboard.jsx` - Advisor dashboard (TODO: full API)
- `src/components/ExaminerDashboard.jsx` - Examiner dashboard (TODO: full API)

### Utilities
- `src/utils/toast.js` - Toast notifications
- `src/utils/dataLoader.js` - API-with-fallback loader
- `src/hooks/useAPI.js` - Custom React hooks for API data

## Using the API in Components

### 1. Using Service Methods Directly
```javascript
import internshipService from '../services/internshipService';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await internshipService.getPositions();
      if (result.success) {
        setPositions(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render positions */}</div>;
}
```

### 2. Using Custom Hooks
```javascript
import { useInternships } from '../hooks/useAPI';

function MyComponent() {
  const { data: positions, loading, error, refetch } = useInternships();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {/* render positions */}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### 3. Using Data Loader with Fallback
```javascript
import { loadInternships } from '../utils/dataLoader';
import internshipService from '../services/internshipService';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInternships(internshipService).then(result => {
      setPositions(result.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render positions */}</div>;
}
```

## Common Patterns

### Show Toast on Error
```javascript
import { toast } from '../utils/toast';

try {
  const result = await internshipService.applyToPosition(positionId, data);
  if (result.success) {
    toast.success('Application submitted!');
  } else {
    toast.error(result.error?.message || 'Application failed');
  }
} catch (err) {
  toast.error('Network error: ' + err.message);
}
```

### Handle Loading States
```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async (formData) => {
  setLoading(true);
  try {
    const result = await internshipService.applyToPosition(positionId, formData);
    if (result.success) {
      // Success
    } else {
      // Handle error
    }
  } finally {
    setLoading(false);
  }
};

return (
  <button onClick={handleSubmit} disabled={loading}>
    {loading ? 'Applying...' : 'Apply'}
  </button>
);
```

### Redirect on 401
Handled automatically by api.js interceptor. If refresh fails, user is logged out.

## API Endpoints Reference

### Authentication
- `POST /api/auth/login/` - Login with email & password
- `POST /api/auth/student/register/` - Register student
- `POST /api/auth/company/register/` - Register company
- `POST /api/auth/verify-otp/` - Verify OTP
- `POST /api/auth/logout/` - Logout
- `GET /api/me/` - Get current user profile
- `PATCH /api/me/` - Update user profile

### Internships
- `GET /api/internships/` - List positions
- `POST /api/internships/` - Create position (company)
- `GET /api/internships/{id}/` - Get position details
- `PATCH /api/internships/{id}/` - Update position (company)
- `POST /api/internships/{id}/apply/` - Apply (student)
- `POST /api/internships/{id}/start/` - Start (mentor)
- `POST /api/internships/{id}/complete/` - Complete (mentor/coordinator)

### Applications
- `GET /api/applications/` - List applications
- `GET /api/applications/{id}/` - Get application details
- `PATCH /api/applications/{id}/mentor-review/` - Mentor review
- `POST /api/applications/{id}/advisor-review/` - Advisor review
- `POST /api/applications/{id}/accept-offer/` - Accept offer
- `PATCH /api/applications/{id}/dept-review/` - Coordinator review

### Users & Admin
- `GET /api/users/` - List all users (admin)
- `GET /api/students/` - List students
- `GET /api/advisors/` - List advisors
- `GET /api/departments/` - List departments
- `POST /api/students/{id}/assign-advisor/` - Assign advisor (coordinator)
- `GET /api/companies/verified/` - List verified companies

### Evaluations
- `POST /api/evaluations/monthly/{id}/{month}/` - Submit monthly eval
- `POST /api/evaluations/final/{id}/` - Submit final eval
- `POST /api/evaluations/advisor/{id}/` - Submit advisor eval
- `POST /api/evaluations/examiner/{id}/` - Submit examiner eval
- `GET /api/evaluations/pending/` - Get pending evals

### Attendance
- `POST /api/attendance/check-in/` - Check in
- `POST /api/attendance/check-out/` - Check out
- `GET /api/attendance/` - Get attendance records

## Error Handling

### HTTP Status Codes
- `400` - Bad request (validation error)
- `401` - Unauthorized (token expired)
- `403` - Forbidden (no permission)
- `404` - Not found (resource doesn't exist)
- `500` - Server error

### Error Response Format
```javascript
{
  success: false,
  error: {
    detail: "Error message",
    message: "Error message",
    // or
    field1: ["Error for field 1"],
    field2: ["Error for field 2"]
  }
}
```

### Handling Different Error Types
```javascript
const result = await service.doSomething();
if (result.success) {
  // Success
} else {
  const errorMsg = result.error?.detail || 
                   result.error?.message || 
                   JSON.stringify(result.error) ||
                   'Unknown error';
  toast.error(errorMsg);
}
```

## Testing the Integration

### 1. Check API Base URL
```javascript
// In browser console
import { BASE_URL } from './api'
console.log('API Base:', BASE_URL)
```

### 2. Test Login
Visit `/login` and try logging in with real credentials.

### 3. Check localStorage
```javascript
// In browser console
localStorage.getItem('access')  // Should have JWT token
localStorage.getItem('user')     // Should have user object
```

### 4. Test Token Refresh
After token expires (wait or manipulate time), make an API call.
Should automatically refresh and succeed.

### 5. Check Network Tab
- POST `/api/auth/login/` should return tokens
- Subsequent requests should have `Authorization: Bearer {token}`
- 401 responses should be retried with refreshed token

## Debugging Tips

### Enable API Logging
```javascript
// Add to src/api.js before exports
api.interceptors.request.use(req => {
  console.log('API Request:', req.method.toUpperCase(), req.url, req.data);
  return req;
});

api.interceptors.response.use(
  res => { console.log('API Response:', res.status, res.data); return res; },
  err => { console.error('API Error:', err.response?.status, err.response?.data); throw err; }
);
```

### Common Issues
1. **401 on every request** - Token might not be saved correctly
2. **CORS errors** - Backend needs CORS headers
3. **401 immediately after login** - Check token storage
4. **Infinite refresh loop** - Check refresh token validity
5. **404 endpoints** - Verify endpoint paths match backend

## Gradual Migration Path

Current status:
- ✅ Login uses API
- ⚠️ Dashboards have fallback (localStorage)
- ❌ Need to fully integrate each dashboard

Next steps:
1. Update StudentDashboard to fetch from API
2. Update CompanyDashboard to fetch from API
3. Update CoordinatorDashboard to fetch from API
4. Update AdvisorDashboard to fetch from API
5. Update ExaminerDashboard to fetch from API
6. Remove localStorage fallback
7. Add proper loading/error states throughout

## Support & Issues

If API integration doesn't work:
1. Check if backend is running
2. Verify `VITE_API_BASE_URL` in .env
3. Check browser console for errors
4. Look at Network tab for API requests
5. Verify token is in localStorage after login
6. Check if Authorization header is being sent
