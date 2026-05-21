# API Integration Quick Reference

## Import statements

```jsx
import storageService from "../services/storageService";
import dataService from "../services/dataService";
import internshipService from "../services/internshipService";
import evaluationService from "../services/evaluationService";
import userService from "../services/userService";
```

## Load Data Patterns

### Simple data load
```jsx
useEffect(() => {
  const load = async () => {
    const data = await storageService.getApplications();
    setApplications(data);
  };
  load();
}, []);
```

### With error handling
```jsx
useEffect(() => {
  const load = async () => {
    try {
      const data = await storageService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load applications");
    }
  };
  load();
}, []);
```

### With loading state
```jsx
useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const data = await storageService.getApplications();
      setApplications(data);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

### Multiple data sources
```jsx
useEffect(() => {
  const load = async () => {
    try {
      const [apps, companies, students] = await Promise.all([
        storageService.getApplications(),
        storageService.getCompanies(),
        storageService.getStudents()
      ]);
      setApplications(apps);
      setCompanies(companies);
      setStudents(students);
    } catch (err) {
      console.error("Error:", err);
    }
  };
  load();
}, []);
```

## Mutation Patterns

### Update existing data
```jsx
const handleUpdate = async (id, updates) => {
  try {
    // Get all data (fresh copy)
    const allApps = await storageService.getApplications(false);
    
    // Update the specific item
    const updated = allApps.map(app =>
      app.id === id ? { ...app, ...updates } : app
    );
    
    // Save back
    storageService.saveApplications(updated);
    setApplications(updated);
  } catch (err) {
    console.error("Failed to update:", err);
  }
};
```

### Add new item
```jsx
const handleAdd = async (newItem) => {
  try {
    const allApps = await storageService.getApplications(false);
    const updated = [{ ...newItem, id: Date.now() }, ...allApps];
    storageService.saveApplications(updated);
    setApplications(updated);
  } catch (err) {
    console.error("Failed to add:", err);
  }
};
```

### Remove item
```jsx
const handleDelete = async (id) => {
  try {
    const allApps = await storageService.getApplications(false);
    const updated = allApps.filter(app => app.id !== id);
    storageService.saveApplications(updated);
    setApplications(updated);
  } catch (err) {
    console.error("Failed to delete:", err);
  }
};
```

## Notification Pattern

```jsx
const addNotification = async (title, message, type = "info") => {
  try {
    const notifications = await storageService.getNotifications(false);
    notifications.push({
      id: Date.now(),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    });
    storageService.saveNotifications(notifications);
  } catch (err) {
    console.error("Failed to save notification:", err);
  }
};
```

## Filtering Pattern

```jsx
useEffect(() => {
  const load = async () => {
    try {
      const allData = await storageService.getApplications();
      const filtered = allData.filter(app => 
        app.status === "PENDING" && 
        app.advisorId === advisorId
      );
      setFiltered(filtered);
    } catch (err) {
      console.error("Error:", err);
    }
  };
  load();
}, [advisorId]);
```

## Refresh/Refetch Pattern

```jsx
// Force refresh (bypass cache)
const handleRefresh = async () => {
  try {
    const data = await storageService.getApplications(false); // false = no cache
    setApplications(data);
  } catch (err) {
    console.error("Error:", err);
  }
};

// Clear all cache
const handleClearCache = () => {
  storageService.clearCache();
};

// Clear specific cache entry
const handleClearApplicationsCache = () => {
  storageService.clearCacheEntry("applications");
};
```

## Polling Pattern (for updates)

```jsx
useEffect(() => {
  const load = async () => {
    const data = await storageService.getApplications();
    setApplications(data);
  };
  
  load(); // Initial load
  const interval = setInterval(load, 5000); // Refresh every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

## Direct API Calls (when needed)

### Using dataService directly
```jsx
// Get companies with filters
const companies = await dataService.getCompanies({ search: "Software" });

// Get internship details
const internship = await dataService.getInternships({ department: "Engineering" });

// Get notifications
const notifications = await dataService.getNotifications({ limit: 10 });
```

### Using specific services
```jsx
// Internship operations
await internshipService.applyToPosition(positionId, data);
await internshipService.mentorReviewApplication(appId, "approved", "Good fit");
await internshipService.acceptOffer(appId);

// Evaluation operations
await evaluationService.submitMonthlyEvaluation(internshipId, month, data);
await evaluationService.submitFinalEvaluation(internshipId, data);

// User operations
const advisors = await userService.getAdvisors();
await userService.assignAdvisor(studentId, advisorId);
```

## Common Find/Replace Operations

### Find: `JSON.parse(localStorage.getItem("applications")) || []`
Replace with: `await storageService.getApplications()`

### Find: `localStorage.setItem("applications", JSON.stringify(data))`
Replace with: `storageService.saveApplications(data)`

### Find: `JSON.parse(localStorage.getItem("companies")) || []`
Replace with: `await storageService.getCompanies()`

### Find: `JSON.parse(localStorage.getItem("students")) || []`
Replace with: `await storageService.getStudents()`

### Find: `JSON.parse(localStorage.getItem("notifications") || "[]")`
Replace with: `await storageService.getNotifications()`

## Error Handling Best Practices

```jsx
// ❌ DON'T: Ignore errors
const data = await storageService.getApplications();

// ✅ DO: Handle errors
try {
  const data = await storageService.getApplications();
  setApplications(data);
} catch (err) {
  console.error("Failed to load applications:", err);
  toast.error("Failed to load data");
  setApplications([]);
}

// ✅ BETTER: Different handling for different errors
try {
  const data = await storageService.getApplications();
  setApplications(data);
} catch (err) {
  if (err.response?.status === 401) {
    navigate("/login");
  } else if (err.response?.status === 403) {
    toast.error("You don't have permission to view this data");
  } else {
    toast.error("Failed to load data. Please try again.");
  }
  setApplications([]);
}
```

## Performance Tips

1. **Use `false` parameter judiciously**
   ```jsx
   // Use cache (default) for fast reads
   const apps = await storageService.getApplications();
   
   // Bypass cache only when needed
   const apps = await storageService.getApplications(false);
   ```

2. **Batch API calls**
   ```jsx
   // ❌ SLOW: Sequential calls
   const apps = await storageService.getApplications();
   const companies = await storageService.getCompanies();
   const students = await storageService.getStudents();
   
   // ✅ FAST: Parallel calls
   const [apps, companies, students] = await Promise.all([
     storageService.getApplications(),
     storageService.getCompanies(),
     storageService.getStudents()
   ]);
   ```

3. **Clear cache after mutations**
   ```jsx
   // After updating applications
   storageService.clearCacheEntry("applications");
   
   // Or force next read to refresh
   const updated = await storageService.getApplications(false);
   ```

## Debugging Tips

1. **Check localStorage in DevTools**
   - Open DevTools → Application → Local Storage
   - Look for keys: applications, companies, students, internships, etc.

2. **Monitor API calls**
   - Open DevTools → Network tab
   - Filter by XHR
   - Verify API endpoints being called

3. **Check in-memory cache**
   - Add console logs after data loads
   - `console.log("Applications:", applications);`

4. **Test fallback behavior**
   - Stop the backend API
   - Verify components still show cached data
   - Check console for error messages

## Related Files

- **API Service Layer**: `src/services/dataService.js`
- **Cache Layer**: `src/services/storageService.js`
- **Migration Guide**: `API_MIGRATION_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Existing Services**: `src/services/internshipService.js`, `evaluationService.js`, `userService.js`

## Need Help?

1. Check the API_MIGRATION_GUIDE.md for detailed examples
2. Look at CompanyDashboard.jsx for reference implementation
3. Follow the patterns shown in this quick reference
4. Check browser console for error messages
5. Verify API is running and responding
