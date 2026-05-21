# API Integration Migration Guide

## Overview
This guide helps migrate components from mock localStorage data to real API calls. Use the new `storageService` and `dataService` for all data operations.

## Quick Start

### Before (Using localStorage)
```jsx
useEffect(() => {
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  setApps(applications);
}, []);
```

### After (Using storageService)
```jsx
import storageService from "../services/storageService";

useEffect(() => {
  const loadData = async () => {
    const applications = await storageService.getApplications();
    setApps(applications);
  };
  loadData();
}, []);
```

## Available Services

### 1. storageService
Provides API-first, localStorage-fallback interface. Use this for most data operations.

**Key Methods:**
- `await storageService.getApplications()` - Load applications
- `await storageService.getCompanies()` - Load companies
- `await storageService.getInternships()` - Load internship positions
- `await storageService.getStudents()` - Load students
- `await storageService.getMonthlyEvaluations()` - Load evaluations
- `await storageService.getFinalEvaluations()` - Load final evaluations
- `await storageService.getNotifications()` - Load notifications
- `await storageService.saveApplications(data)` - Save data
- `await storageService.clearCache()` - Clear in-memory cache

### 2. dataService
Direct API calls without caching. Use for specific operations.

**Key Methods:**
- `dataService.getCompanies(params)` - List companies
- `dataService.getInternships(params)` - List internships
- `dataService.getApplications(params)` - List applications
- `dataService.getStudents(params)` - List students
- `dataService.getMonthlyEvaluations(params)` - List evaluations
- `dataService.getFinalEvaluations(params)` - List final evaluations
- `dataService.getLogbookEntries(internshipId, params)` - List logbook
- `dataService.getNotifications(params)` - List notifications
- `dataService.getAdvisorStudents(params)` - Get students for advisor

### 3. internshipService
Specialized internship operations.

**Key Methods:**
- `internshipService.getPositions(params)` - All internship positions
- `internshipService.getApplications(params)` - All applications
- `internshipService.applyToPosition(positionId, data)` - Apply for internship
- `internshipService.mentorReviewApplication(appId, decision, comment)` - Mentor review
- `internshipService.advisorReviewApplication(appId, decision, comment)` - Advisor review
- `internshipService.acceptOffer(appId)` - Accept offer
- `internshipService.startInternshipByPosition(positionId, data)` - Start internship

### 4. evaluationService
Evaluation operations.

**Key Methods:**
- `evaluationService.submitMonthlyEvaluation(internshipId, month, data)` - Submit monthly eval
- `evaluationService.submitFinalEvaluation(internshipId, data)` - Submit final eval
- `evaluationService.submitAdvisorEvaluation(studentId, data)` - Advisor evaluation

### 5. userService
User data operations.

**Key Methods:**
- `userService.getStudents(params)` - List students
- `userService.getAdvisors(params)` - List advisors
- `userService.assignAdvisor(studentId, advisorId)` - Assign advisor

## Migration Examples

### Example 1: AdvisorDashboard - Loading Applications

**Before:**
```jsx
useEffect(() => {
  const allApps = JSON.parse(localStorage.getItem("applications")) || [];
  const active = allApps.filter(app => app.finalInternshipStatus === "ACTIVE_INTERN");
  setApplications(active);
}, [advisorIdentity]);
```

**After:**
```jsx
useEffect(() => {
  const loadApplications = async () => {
    const allApps = await storageService.getApplications();
    const active = allApps.filter(app => app.finalInternshipStatus === "ACTIVE_INTERN");
    setApplications(active);
  };
  loadApplications();
}, [advisorIdentity]);
```

### Example 2: CompanyDashboard - Loading Internship Positions

**Before:**
```jsx
const saved = localStorage.getItem("allInternships");
const internships = saved ? JSON.parse(saved) : [];
```

**After:**
```jsx
useEffect(() => {
  const loadInternships = async () => {
    const internships = await storageService.getInternships();
    setInternships(internships);
  };
  loadInternships();
}, []);
```

### Example 3: StudentDashboard - Loading Notifications

**Before:**
```jsx
const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
```

**After:**
```jsx
useEffect(() => {
  const loadNotifications = async () => {
    const notifications = await storageService.getNotifications();
    setNotifications(notifications);
  };
  loadNotifications();
}, []);
```

## Error Handling

Always handle errors when using async data loading:

```jsx
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await storageService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load data. Please try again.");
      // Fall back to empty state or cached data
      setApplications([]);
    }
  };
  loadData();
}, []);
```

## Caching Strategy

- `storageService` maintains an in-memory cache for performance
- Data is automatically cached to localStorage as fallback
- Use `storageService.clearCache()` after mutations to refresh data
- Use `useCache = false` parameter to skip cache: `await storageService.getApplications(false)`

## localStorage Keys Being Replaced

The following localStorage keys are now managed by storageService:

| Key | Service Method |
|-----|-----------------|
| `applications` | `storageService.getApplications()` |
| `companies` | `storageService.getCompanies()` |
| `allInternships` | `storageService.getInternships()` |
| `students` | `storageService.getStudents()` |
| `monthlyEvaluations` | `storageService.getMonthlyEvaluations()` |
| `finalEvaluations` | `storageService.getFinalEvaluations()` |
| `logbooks` | `storageService.getLogbooks()` |
| `notifications` | `storageService.getNotifications()` |

## Removing Mock Data Files

Once migration is complete, these files can be removed:
- `src/mock/applications.json`
- `src/mock/companies.json`
- `src/mock/logbooks.json`
- `src/mock/monthlyEvaluations.json`
- `src/mock/finalCompanyEvaluations.json`
- `src/mock/internshipApi.js`

## Testing

When migrating a component:
1. Update one data source at a time
2. Test in browser with API running
3. Verify API calls in Network tab
4. Check localStorage to confirm cache is working
5. Test fallback by stopping API (should still work)
6. Once confident, remove the localStorage fallback

## FAQ

**Q: Can I still use localStorage?**
A: Yes, `storageService` automatically caches to localStorage as fallback.

**Q: Do I need to remove localStorage calls manually?**
A: No, but they should be removed for clarity once migration is complete.

**Q: What if the API is slow?**
A: `storageService` caches in memory, so subsequent calls are instant.

**Q: How do I force a refresh?**
A: Use `storageService.clearCache()` or `await storageService.getApplications(false)`.

## Next Steps

1. Identify which components need updating (see list below)
2. Update one component at a time
3. Test with API running
4. Once confident with API stability, remove localStorage fallbacks
5. Delete mock JSON files

### Components to Update

- [ ] AdvisorDashboard.jsx - applications, notifications
- [ ] CoordinatorDashboard.jsx - applications, students
- [ ] CompanyDashboard.jsx - applications, internships, students
- [ ] StudentDashboard.jsx - applications, logbooks
- [ ] ExaminerDashboard.jsx - applications, evaluations
- [ ] AdminDashboard.jsx - companies, students, users
- [ ] UploadStudentLists.jsx - students
- [ ] CreateAccounts.jsx - users
