# Coordinator Registration Test Results

## ❌ Error: Staff Not Pre-registered

**Request:**
```bash
curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/register/staff/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "Kebede@example.com",
    "username": "Kebede",
    "password": "12345678"
  }'
```

**Response:**
```json
{
  "non_field_errors": [
    "This staff is not pre-registered or already used."
  ]
}
```

---

## 📋 Why This Error Occurs

For **Coordinator**, **Advisor**, and **Examiner** roles, the backend requires:

1. **Pre-registration step** (Admin only): Create a `PreRegisteredStaff` record with:
   - email (e.g., `Kebede@example.com`)
   - role (e.g., `COORDINATOR`)
   - department

2. **Registration step** (User-facing): User then registers using that email with:
   - email
   - username (full_name in your case: "Kebede")
   - password
   - phone (optional in API)
   - department (optional in API)

---

## ✅ Working Payload Format

Your payload is **correct**:
```json
{
  "email": "Kebede@example.com",
  "username": "Kebede",
  "password": "12345678"
}
```

**Field Mapping:**
- `email` → "Kebede@example.com"
- `username` → "Kebede" (from full_name)
- `password` → "12345678"

---

## 🔧 Next Steps to Fix

**Option 1: Pre-register via Admin Panel**
```bash
# Admin creates PreRegisteredStaff for Kebede
POST /api/admin/pre-register-staff/
{
  "email": "Kebede@example.com",
  "role": "COORDINATOR",
  "department": "Mechanical Engineering"
}
```

**Option 2: Use an Already Pre-registered Email**
- Contact backend admin to check which emails are pre-registered
- Use one of those emails for testing

**Option 3: Check Database Directly**
```sql
SELECT email, role FROM auth_preregisteredstaff;
```

---

## ✅ Expected Success Response

Once pre-registered, the registration will return:
```json
{
  "message": "Staff registered successfully (dev mode: OTP skipped).",
  "tokens": {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 82,
    "email": "Kebede@example.com",
    "role": "COORDINATOR"
  }
}
```

---

## 📊 Complete Staff Registration Data

**Your Input:**
- department: "Mechanical Engineering"
- email: "Kebede@example.com"
- full_name: "Kebede" → username
- password: "12345678"
- phone: "090000000"
- role: "coordinator"

**API Payload (username from full_name):**
```json
{
  "email": "Kebede@example.com",
  "username": "Kebede",
  "password": "12345678"
}
```

✅ Format is correct. Awaiting pre-registration in backend.
