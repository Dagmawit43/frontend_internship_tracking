#!/bin/bash

# Registration API Test Commands
# Backend: https://internship-tracker-backend-ycc5.onrender.com
# All endpoints in dev mode (OTP skipped)

BASE_URL="https://internship-tracker-backend-ycc5.onrender.com"

echo "=========================================="
echo "01 - COORDINATOR REGISTRATION"
echo "=========================================="
curl -X POST $BASE_URL/api/register/staff/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kebede@example.com",
    "username": "Kebede",
    "password": "12345678"
  }' | jq .

# # OTP Verification (commented out - dev mode skips this)
# curl -X POST $BASE_URL/api/auth/verify-otp/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "kebede@example.com",
#     "otp": "YOUR_OTP"
#   }' | jq .

echo -e "\n=========================================="
echo "02 - ADVISOR REGISTRATION"
echo "=========================================="
curl -X POST $BASE_URL/api/register/staff/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor@example.com",
    "username": "advisor",
    "password": "12345678"
  }' | jq .

# # OTP Verification (commented out - dev mode skips this)
# curl -X POST $BASE_URL/api/auth/verify-otp/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "advisor@example.com",
#     "otp": "YOUR_OTP"
#   }' | jq .

echo -e "\n=========================================="
echo "03 - STUDENT REGISTRATION"
echo "=========================================="
curl -X POST $BASE_URL/api/auth/student/register/ \
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
  }' | jq .

# # OTP Verification (commented out - dev mode skips this)
# curl -X POST $BASE_URL/api/auth/verify-otp/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "john.student@example.com",
#     "otp": "YOUR_OTP"
#   }' | jq .

echo -e "\n=========================================="
echo "04 - COMPANY REGISTRATION"
echo "=========================================="
curl -X POST $BASE_URL/api/auth/company/register/ \
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
  }' | jq .

# # OTP Verification (commented out - dev mode skips this)
# curl -X POST $BASE_URL/api/auth/verify-otp/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "mentor@company.com",
#     "otp": "YOUR_OTP"
#   }' | jq .

echo -e "\n=========================================="
echo "Registration tests completed!"
echo "=========================================="
