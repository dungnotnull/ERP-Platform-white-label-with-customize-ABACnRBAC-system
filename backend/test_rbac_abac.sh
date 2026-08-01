#!/bin/bash
BASE="http://localhost:8000/api/v1"
PASS="Test@123456"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass=0
fail=0

login() {
  local email="$1"
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\"}" \
    | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
}

# Extract "id" from nested {"success":true,"data":{"id":"..."}}
extract_id() {
  echo "$1" | grep -oE '"id":"[a-f0-9]{24}"' | head -1 | cut -d'"' -f4
}

# Extract all "id" values from a JSON response (handles arrays and nested data)
extract_all_ids() {
  echo "$1" | grep -oE '"id":"[a-f0-9]{24}"' | sed 's/"id":"//;s/"//'
}

assert_status() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}PASS${NC} [$actual] $desc"
    pass=$((pass+1))
  else
    echo -e "  ${RED}FAIL${NC} [$actual] (expected $expected) $desc"
    fail=$((fail+1))
  fi
}

echo -e "${CYAN}=== Logging in test accounts ===${NC}"
SUPERADMIN_TOKEN=$(login "superadmin@test.com")
ADMIN_TOKEN=$(login "admin@test.com")
MANAGER_TOKEN=$(login "manager@test.com")
LEADER_TOKEN=$(login "leader@test.com")
MEMBER_TOKEN=$(login "member@test.com")

if [ -z "$SUPERADMIN_TOKEN" ] || [ -z "$MEMBER_TOKEN" ]; then
  echo -e "${RED}Failed to login. Aborting.${NC}"; exit 1
fi
echo -e "${GREEN}All 5 accounts logged in${NC}"

AUTH="Authorization: Bearer $SUPERADMIN_TOKEN"

# =========================================================================
echo -e "\n${CYAN}=== 0. CLEANUP ===${NC}"
# =========================================================================
echo -e "\n${YELLOW}0.1 Remove leftover test ABAC policies (e2e- prefix only)${NC}"
POLICIES=$(curl -s -H "$AUTH" "$BASE/abac-policies")
CLEANED=0
for pid in $(extract_all_ids "$POLICIES"); do
  NAME=$(echo "$POLICIES" | grep -oE "\"id\":\"$pid\",\"name\":\"[^\"]*\"" | head -1 | sed 's/.*"name":"//;s/"//')
  if echo "$NAME" | grep -q "^e2e-"; then
    curl -s -o /dev/null -X DELETE -H "$AUTH" "$BASE/abac-policies/$pid"
    CLEANED=$((CLEANED+1))
  fi
done
echo "  Cleaned $CLEANED test policies (prefixed e2e-)"

# =========================================================================
echo -e "\n${CYAN}=== 1. RBAC LAYER ===${NC}"
# =========================================================================

echo -e "\n${YELLOW}1.1 Public endpoint${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
assert_status "GET /health (public)" "200" "$S"

echo -e "\n${YELLOW}1.2 Unauthenticated${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/devices")
assert_status "GET /devices (no token)" "401" "$S"

echo -e "\n${YELLOW}1.3 Superadmin bypass${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SUPERADMIN_TOKEN" "$BASE/devices")
assert_status "GET /devices (superadmin)" "200" "$S"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SUPERADMIN_TOKEN" "$BASE/roles")
assert_status "GET /roles (superadmin)" "200" "$S"

echo -e "\n${YELLOW}1.4 Admin (80 perms)${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/devices")
assert_status "GET /devices (admin)" "200" "$S"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/roles")
assert_status "GET /roles (admin)" "200" "$S"

echo -e "\n${YELLOW}1.5 Manager (73 perms)${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MANAGER_TOKEN" "$BASE/devices")
assert_status "GET /devices (manager)" "200" "$S"

echo -e "\n${YELLOW}1.6 Member (35 perms, read-only)${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices")
assert_status "GET /devices (member)" "200" "$S"
S=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{}' "$BASE/devices")
assert_status "POST /devices (member, denied)" "403" "$S"

echo -e "\n${YELLOW}1.7 Invalid token${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid" "$BASE/devices")
assert_status "GET /devices (invalid token)" "401" "$S"

# =========================================================================
echo -e "\n${CYAN}=== 2. ABAC LAYER ===${NC}"
# =========================================================================

# Get member role ID
echo -e "\n${YELLOW}2.0 Setup${NC}"
ROLES=$(curl -s -H "$AUTH" "$BASE/roles")
MEMBER_ROLE_ID=$(echo "$ROLES" | grep -oE '"name":"[a-zA-Z ]*member[a-zA-Z ]*"' | head -1 | sed 's/"name":"//;s/"//')
if [ -n "$MEMBER_ROLE_ID" ]; then
  MEMBER_ROLE_ID=$(echo "$ROLES" | grep -oE '"id":"[a-f0-9]{24}","name":"[a-zA-Z ]*'"$MEMBER_ROLE_ID"'[a-zA-Z ]*"' | head -1 | grep -oE '"id":"[a-f0-9]{24}"' | cut -d'"' -f4)
else
  # Fallback: get last role
  MEMBER_ROLE_ID=$(echo "$ROLES" | grep -oE '"id":"[a-f0-9]{24}"' | tail -1 | cut -d'"' -f4)
fi
echo "Member role ID: $MEMBER_ROLE_ID"

# 2.1 Deny policy with NO conditions
echo -e "\n${YELLOW}2.1 Deny policy, no conditions -> blocks member${NC}"
RESP=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$BASE/abac-policies" -d "{
  \"name\":\"e2e-deny-member-read\",\"description\":\"Deny member device read\",
  \"roleIds\":[\"$MEMBER_ROLE_ID\"],\"resource\":\"device\",\"action\":\"read\",
  \"effect\":\"deny\",\"conditions\":[],\"createdBy\":\"test\"
}")
DENY_ID=$(extract_id "$RESP")
echo "Created deny policy: $DENY_ID"

sleep 1
MEMBER_TOKEN=$(login "member@test.com")

S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices")
assert_status "GET /devices (member, deny no-cond)" "403" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MANAGER_TOKEN" "$BASE/devices")
assert_status "GET /devices (manager, deny not for this role)" "200" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SUPERADMIN_TOKEN" "$BASE/devices")
assert_status "GET /devices (superadmin, bypasses ABAC)" "200" "$S"

# 2.2 No policies = default allow
echo -e "\n${YELLOW}2.2 No ABAC policies = RBAC passes through${NC}"
[ -n "$DENY_ID" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$BASE/abac-policies/$DENY_ID"
sleep 1
MEMBER_TOKEN=$(login "member@test.com")
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices")
assert_status "GET /devices (member, no policies)" "200" "$S"

# 2.3 Allow policy with conditions
echo -e "\n${YELLOW}2.3 Allow policy with conditions${NC}"
RESP=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$BASE/abac-policies" -d "{
  \"name\":\"e2e-allow-dept-exists\",\"description\":\"Allow if user has dept\",
  \"roleIds\":[],\"resource\":\"device\",\"action\":\"read\",\"effect\":\"allow\",
  \"conditions\":[{\"field\":\"user.departmentId\",\"operator\":\"exists\",\"value\":true,\"valueType\":\"static\"}],
  \"createdBy\":\"test\"
}")
ALLOW_ID=$(extract_id "$RESP")
echo "Created allow policy: $ALLOW_ID"

sleep 1
MEMBER_TOKEN=$(login "member@test.com")
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices")
assert_status "GET /devices (member, allow with dept exists)" "200" "$S"

[ -n "$ALLOW_ID" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$BASE/abac-policies/$ALLOW_ID"

# 2.4 Deny overrides Allow
echo -e "\n${YELLOW}2.4 Deny + Allow -> deny wins${NC}"
D=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$BASE/abac-policies" -d "{
  \"name\":\"e2e-deny-all\",\"roleIds\":[],\"resource\":\"device\",\"action\":\"read\",
  \"effect\":\"deny\",\"conditions\":[],\"createdBy\":\"test\"
}" | grep -oE '"id":"[a-f0-9]{24}"' | head -1 | cut -d'"' -f4)

A=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$BASE/abac-policies" -d "{
  \"name\":\"e2e-allow-all\",\"roleIds\":[],\"resource\":\"device\",\"action\":\"read\",
  \"effect\":\"allow\",\"conditions\":[],\"createdBy\":\"test\"
}" | grep -oE '"id":"[a-f0-9]{24}"' | head -1 | cut -d'"' -f4)

sleep 1
MEMBER_TOKEN=$(login "member@test.com")
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices")
assert_status "GET /devices (deny+allow, deny wins)" "403" "$S"

for pid in $D $A; do
  [ -n "$pid" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$BASE/abac-policies/$pid"
done

# 2.5 ABAC CRUD
echo -e "\n${YELLOW}2.5 ABAC CRUD operations${NC}"
RESP=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$BASE/abac-policies" -d "{
  \"name\":\"e2e-crud-test\",\"roleIds\":[],\"resource\":\"device\",\"action\":\"export\",
  \"effect\":\"deny\",\"conditions\":[],\"createdBy\":\"test\"
}")
CRUD_ID=$(extract_id "$RESP")
assert_status "Create ABAC policy" "non-empty" "$([ -n "$CRUD_ID" ] && echo non-empty || echo empty)"

S=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/abac-policies")
assert_status "List ABAC policies" "200" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/abac-policies/$CRUD_ID" -d "{\"description\":\"Updated\"}")
assert_status "Update ABAC policy" "200" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -H "$AUTH" "$BASE/abac-policies/$CRUD_ID")
assert_status "Delete ABAC policy" "200" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/abac-policies/$CRUD_ID")
assert_status "Get deleted policy" "404" "$S"

# =========================================================================
echo -e "\n${CYAN}=== 3. Cross-layer ===${NC}"
# =========================================================================

echo -e "\n${YELLOW}3.1 RBAC blocks before ABAC evaluates${NC}"
S=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/devices/test-id")
assert_status "DELETE /devices/:id (member, RBAC deny)" "403" "$S"

S=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/devices/test-id")
assert_status "DELETE /devices/:id (no token, 401)" "401" "$S"

# =========================================================================
echo -e "\n${CYAN}=== SUMMARY ===${NC}"
echo -e "  ${GREEN}Passed: $pass${NC}"
echo -e "  ${RED}Failed: $fail${NC}"
echo -e "  Total:  $((pass+fail))"
[ "$fail" -eq 0 ] && echo -e "\n${GREEN}ALL TESTS PASSED${NC}" || echo -e "\n${RED}SOME TESTS FAILED${NC}"
