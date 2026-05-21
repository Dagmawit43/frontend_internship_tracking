# Registration Debugging Guide

## What I Added

I've added console logging to trace the entire registration flow. Follow these steps to debug:

---

## Step-by-Step Debugging

### 1. Open Browser Developer Tools
```
Press: F12 or Right-click → Inspect → Console tab
```

### 2. Try Student Registration

**Fill form:**
- Role: Student
- Full Name: John Doe
- Email: john.doe@aastustudent.edu.et
- Phone: 0911234567
- Student ID: STU001
- Department: Computer Science
- Password: Test123!@
- Confirm Password: Test123!@

**Click "Register"**

### 3. Check Console Output - What You Should See

#### Expected Console Logs (in order):

```
🔵 Form submitted with role: Student
📋 Form data: {role: 'Student', fullName: 'John Doe', ...}

👤 Student Registration Flow
📤 Calling authService.registerStudent()

🔵 authService.registerStudent called with: {email: 'john.doe@aastustudent.edu.et', full_name: 'John Doe', ...}
📡 Making POST request to /api/auth/student/register/
📡 API Request: POST /api/auth/student/register/ {data: {...}}

✅ Student registration response: {tokens: {access: '...', refresh: '...'}, user: {...}}
✅ Response received: {success: true, data: {...}}

🎉 Registration successful!
```

---

## Console Debugging Checklist

### ❌ If you see NO console logs at all:

1. **Form not submitting** - Check:
   - Is the submit button clickable?
   - Try clicking button, watch for any JS errors
   - Check if form validation is blocking

2. **Console not showing logs** - Fix:
   - Refresh page: F5
   - Clear console: `console.clear()`
   - Make sure "All" level is selected (not just Errors)

---

### ❌ If you see logs but only up to "Form submitted":

1. **Form validation errors** - The code is checking:
   - Email format (must end with @aastustudent.edu.et for Student)
   - Phone format (must be 9-15 digits)
   - Passwords match
   - Required fields filled

2. **Check error message** - Look for red error box on form
   - It will show what validation failed

3. **Fix and retry** - Correct the field, click Register again

---

### ❌ If you see "Calling authService.registerStudent()" but NO "Making POST request":

1. **authService not being called** - This means:
   - Service import might be broken
   - Method might not exist
   - Try in console:
   ```javascript
   import { authService } from './src/services/authService'
   console.log(authService)
   // Should show all methods
   ```

2. **Fix**: Check `src/services/authService.js` exists and has all methods

---

### ❌ If you see "Making POST request" but NO "API Request":

1. **Axios not being called** - Check:
   - Is api.js properly imported?
   - Try in console:
   ```javascript
   import api from './src/api'
   console.log(api.defaults.baseURL)
   // Should show: https://internship-tracker-backend-ycc5.onrender.com/api
   ```

2. **Fix**: Verify .env file has correct VITE_API_BASE_URL

---

### ❌ If you see "API Request: POST..." but NO response logs:

1. **Request is being sent but no response** - This means:
   - Backend might be down
   - CORS error (check Network tab)
   - Request timed out
   - Check Network tab (F12 → Network):

   **Look for**: Request to `/api/auth/student/register/`
   - Status should be 201 (Created)
   - If status is 0 or blank → CORS/Network issue
   - If status is 500 → Backend error
   - If request doesn't appear at all → Blocked

---

### ❌ If you see response but "❌ Registration failed":

1. **Backend returned error** - The error is shown:
   - Check console: "❌ Registration failed:"
   - Check red error box on form
   - Common errors:
     - Email already registered
     - Invalid student ID format
     - User not pre-registered

2. **Example errors**:
   ```
   - Email must be unique
   - Student ID already exists
   - Department not found
   - Not pre-registered
   ```

---

## Network Tab Debugging (F12 → Network)

### 1. Open Network Tab
- Press F12
- Click "Network" tab
- Clear existing requests: right-click → Clear entries

### 2. Try Registration Again
- Fill form completely
- Click "Register"

### 3. Look for these requests:

**For Student Registration:**
```
POST /api/auth/student/register/
Status: 201 (Created) ✅ or 400 (Bad Request) ❌
```

**For Company Registration:**
```
POST /api/auth/company/register/
Status: 201 (Created) ✅ or 400 (Bad Request) ❌
```

**For Staff Registration:**
```
POST /api/register/staff/
Status: 201 (Created) ✅ or 400 (Bad Request) ❌

POST /api/auth/verify-otp/
Status: 200 (OK) ✅ or 400 (Bad Request) ❌
```

### 4. If request doesn't appear:
- Check your internet connection
- Check if backend is running
- Check CORS headers (Response tab)

### 5. If request appears with error:
- Click request → Response tab
- See what error backend returned
- Fix based on error message

---

## API Base URL Verification

### Check if .env is loaded correctly:

**In browser console:**
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
// Should show: https://internship-tracker-backend-ycc5.onrender.com/api
```

**If it shows undefined:**
1. Make sure `.env` file exists in project root
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R

---

## Common Issues & Fixes

### ❌ Issue: "CORS error" in console

**Fix:**
- Backend needs to allow requests from frontend origin
- Check backend CORS settings
- Temporarily test with backend CORS enabled for all origins

### ❌ Issue: "TypeError: Cannot read property 'registerStudent' of undefined"

**Fix:**
- authService import broken
- Verify file exists: `src/services/authService.js`
- Check export: `export const authService = { ... }`

### ❌ Issue: "Network request failed"

**Fix:**
- Backend server might be down
- Check: https://internship-tracker-backend-ycc5.onrender.com/api/schema/
- If it shows "Connection refused" → backend is down

### ❌ Issue: Status 400 "Bad Request"

**Fix:**
- Check response message in Network tab
- Common: Invalid email, phone, or data format
- Match backend requirements

---

## Full Test Checklist

- [ ] 1. Open http://localhost:5173/register
- [ ] 2. Open F12 → Console tab
- [ ] 3. Clear console: `console.clear()`
- [ ] 4. Select Student role
- [ ] 5. Fill all fields correctly
- [ ] 6. Click Register
- [ ] 7. Check console for logs
- [ ] 8. If no logs → reload page, check errors
- [ ] 9. If logs show error → fix based on error message
- [ ] 10. If logs show success → check for redirect to /login

---

## Quick Test Commands

**Test in browser console to see if everything is set up:**

```javascript
// 1. Check environment variables
console.log("API URL:", import.meta.env.VITE_API_BASE_URL)

// 2. Check authService
import { authService } from './src/services/authService'
console.log("authService methods:", Object.keys(authService))

// 3. Check API config
import api from './src/api'
console.log("API baseURL:", api.defaults.baseURL)

// 4. Test a simple request (no auth needed)
const response = await api.get('/schema/')
console.log("Schema response:", response.data)
```

If any of these show errors → fix that part first

---

## Still Not Working?

Please share:

1. **Screenshot of console logs** - What exactly do you see?
2. **Network tab request** - What's the status code?
3. **Error message** - Full error text
4. **What role** - Student/Company/Advisor/Coordinator/Examiner?
5. **Form data** - What values did you enter?

Then I can pinpoint the exact issue!

---

## Expected Behavior by Role

### Student Registration Flow
```
✅ Form submitted
✅ Validation passes
✅ authService.registerStudent() called
✅ POST to /api/auth/student/register/
✅ Backend validates pre-registered student
✅ Returns tokens + user
✅ Tokens saved to localStorage
✅ Success toast shown
✅ Redirect to /login
```

### Company Registration Flow
```
✅ Form submitted
✅ Validation passes
✅ authService.registerCompany() called
✅ POST to /api/auth/company/register/
✅ Returns tokens + user
✅ Tokens saved to localStorage
✅ Success toast shown
✅ Redirect to /login
```

### Staff Registration Flow (Coordinator/Advisor/Examiner)
```
✅ Form submitted
✅ Validation passes
✅ OTP modal shown
✅ User enters OTP
✅ authService.verifyOTP() called
✅ POST to /api/auth/verify-otp/
✅ authService.registerStaff() called
✅ POST to /api/register/staff/
✅ Returns tokens + user
✅ Tokens saved to localStorage
✅ Success toast shown
✅ Redirect to /login
```

---

## How to Report Issues

When console logs don't match expected output, provide:

1. **Exact console output** - Copy-paste all logs
2. **Network tab screenshot** - Show request status
3. **Error message** - Full error text
4. **Steps to reproduce** - Exactly what you did
5. **Browser** - Chrome/Firefox/Safari/Edge

This will help identify exactly where the flow is breaking!
