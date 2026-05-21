# Registration API Integration Summary

## Base URL
```
https://internship-tracker-backend-ycc5.onrender.com
```

## 1. Coordinator Registration ✅ (Pre-registered only)

**Endpoint**: `POST /api/register/staff/`

**Requirements**:
- Must have pre-registered PreRegisteredStaff with email and role=COORDINATOR
- Dev mode skips OTP verification

**Curl Command**:
```bash
curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/register/staff/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kebede@example.com",
    "username": "Kebede",
    "password": "12345678"
  }'
```

**Success Response**:
```json
{
  "message": "Staff registered successfully (dev mode: OTP skipped).",
  "tokens": {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 82,
    "email": "kebede@example.com",
    "role": "COORDINATOR"
  }
}
```

---

## 2. Advisor Registration ✅ (Pre-registered only)

**Endpoint**: `POST /api/register/staff/`

**Requirements**:
- Must have pre-registered PreRegisteredStaff with email and role=ADVISOR
- Dev mode skips OTP verification

**Curl Command**:
```bash
curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/register/staff/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor@example.com",
    "username": "advisor",
    "password": "12345678"
  }'
```

---

## 3. Student Registration ✅

**Endpoint**: `POST /api/auth/student/register/`

**Requirements**:
- Department must exist in the database
- Valid student_id format
- Dev mode skips OTP verification

**Curl Command**:
```bash
curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/auth/student/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Software Engineering",
    "student_id": "STU001",
    "user": {
      "username": "john_student",
      "email": "john.student@example.com",
      "password": "12345678",
      "phone": "+251911000001"
    }
  }'
```

**Available Departments**:
- Software Engineering
- Electrical Engineering
- Mechanical Engineering
- ElectroMechanical Engineering

---

## 4. Company Registration ✅

**Endpoint**: `POST /api/auth/company/register/`

**Requirements**:
- Unique email and username
- Valid company information
- Dev mode skips OTP verification

**Curl Command**:
```bash
curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/auth/company/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "username": "company_mentor",
      "email": "mentor@company.com",
      "password": "12345678",
      "phone": "+251900000002"
    },
    "company_name": "Tech Company Inc",
    "registration_number": "REG-001",
    "industry_type": "Software",
    "address": "Addis Ababa",
    "contact_email": "mentor@company.com",
    "contact_phone": "+251900000002",
    "website": "https://techcompany.com"
  }'
```

**Success Response**:
```json
{
  "message": "Company registered successfully (dev mode: OTP skipped).",
  "tokens": {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 83,
    "email": "mentor@company.com",
    "role": "COMPANY",
    "company_id": 35
  }
}
```

---

## OTP Verification (Commented - Dev Mode)

In development, OTP is automatically skipped. In production, you would verify OTP:

```bash
# Uncomment in production
# curl -X POST https://internship-tracker-backend-ycc5.onrender.com/api/auth/verify-otp/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "user@example.com",
#     "otp": "123456"
#   }'
```

---

## Test Script

Run all tests at once:
```bash
./curl_registration_commands.sh
```

## Notes

- **Coordinator & Advisor**: Require pre-registration by admin via PreRegisteredStaff model
- **Student**: Department must exist; check `/api/departments/` for available departments
- **Company**: No pre-registration needed; auto-creates company profile
- **Dev Mode**: All endpoints skip OTP verification for testing
