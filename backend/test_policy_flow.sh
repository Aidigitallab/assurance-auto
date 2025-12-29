#!/bin/bash

# Test script for Policy (Iteration 5) workflow
# Creates user, vehicle, product, quote, then subscribes to policy

set -e

BASE_URL="http://localhost:5000"

echo "=========================================="
echo "Testing Iteration 5: Policy Subscription"
echo "=========================================="
echo ""

# 1. Register new client
echo "=== Step 1: Register new client ==="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser'$(date +%s)'@example.com", "password": "Test@12345", "name": "Test User"}')
  
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo "✅ User registered successfully"
echo "User ID: $USER_ID"
echo ""

# 2. Create vehicle
echo "=== Step 2: Create vehicle ==="
VEHICLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehicles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "TEST'$(date +%s)'",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2022,
    "marketValue": 15000000,
    "usage": "PRIVATE"
  }')

VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$VEHICLE_ID" ]; then
  echo "❌ Vehicle creation failed"
  echo "$VEHICLE_RESPONSE"
  exit 1
fi

echo "✅ Vehicle created successfully"
echo "Vehicle ID: $VEHICLE_ID"
echo ""

# 3. Create quote
echo "=== Step 3: Create quote ==="
QUOTE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicleId\": \"$VEHICLE_ID\",
    \"productCode\": \"TOUS_RISQUES\",
    \"selectedOptions\": [\"ASSISTANCE_24_7\", \"PROTECTION_JURIDIQUE\"]
  }")

QUOTE_ID=$(echo "$QUOTE_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
PREMIUM=$(echo "$QUOTE_RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$QUOTE_ID" ]; then
  echo "❌ Quote creation failed"
  echo "$QUOTE_RESPONSE"
  exit 1
fi

echo "✅ Quote created successfully"
echo "Quote ID: $QUOTE_ID"
echo "Premium: $PREMIUM XOF"
echo ""

# 4. Subscribe to policy
echo "=== Step 4: Subscribe to policy ==="
POLICY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"quoteId\": \"$QUOTE_ID\",
    \"paymentMethod\": \"CARD\"
  }")

echo "$POLICY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$POLICY_RESPONSE"
echo ""

POLICY_ID=$(echo "$POLICY_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
PAYMENT_STATUS=$(echo "$POLICY_RESPONSE" | grep -o '"paymentStatus":"[^"]*"' | cut -d'"' -f4)

if [ -z "$POLICY_ID" ]; then
  echo "❌ Policy subscription failed"
  exit 1
fi

echo "✅ Policy subscribed successfully"
echo "Policy ID: $POLICY_ID"
echo "Payment Status: $PAYMENT_STATUS"
echo ""

# 5. Get policy details
echo "=== Step 5: Get policy details ==="
POLICY_DETAILS=$(curl -s "$BASE_URL/api/policies/$POLICY_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$POLICY_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$POLICY_DETAILS"
echo ""

# 6. List my policies
echo "=== Step 6: List my policies ==="
MY_POLICIES=$(curl -s "$BASE_URL/api/policies" \
  -H "Authorization: Bearer $TOKEN")

echo "$MY_POLICIES" | python3 -m json.tool 2>/dev/null || echo "$MY_POLICIES"
echo ""

# 7. Admin stats
echo "=== Step 7: Get admin statistics ==="
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@assurance.local", "password": "Admin@12345"}')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
  STATS=$(curl -s "$BASE_URL/api/admin/policies/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
  echo ""
fi

echo "=========================================="
echo "✅ All tests completed successfully!"
echo "=========================================="
