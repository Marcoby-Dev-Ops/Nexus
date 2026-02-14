#!/bin/bash

# Provisioning script for Marcoby IAM (Authentik)
# Automates creation of client groups and users for Private AI OS redirection.

# Configuration
AUTHENTIK_URL="https://identity.marcoby.com"
API_TOKEN="gr4C7hw5bc7RBCn1tJQBzwS9W6vez94gTwFzIGPno5jmPRNlLO3raFqF91yU"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function usage() {
    echo -e "${BLUE}Usage:${NC} $0 <client_name> <instance_url> <username> <email> <full_name>"
    echo -e "${BLUE}Example:${NC} $0 Tesla tesla.marcoby.net elon elon@tesla.com 'Elon Musk'"
    exit 1
}

if [ "$#" -ne 5 ]; then
    usage
fi

CLIENT_NAME=$1
INSTANCE_URL=$2
USERNAME=$3
EMAIL=$4
FULL_NAME=$5

echo -e "${BLUE}[1/3] Creating Client Group: ${CLIENT_NAME}...${NC}"

# 1. Create Group
GROUP_RESPONSE=$(curl -s -X POST "${AUTHENTIK_URL}/api/v3/core/groups/" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${CLIENT_NAME}\",
        \"attributes\": {
            \"instance_url\": \"${INSTANCE_URL}\"
        }
    }")

GROUP_PK=$(echo $GROUP_RESPONSE | jq -r '.pk')

if [ "$GROUP_PK" == "null" ] || [ -z "$GROUP_PK" ]; then
    echo -e "${RED}Error creating group:${NC}"
    echo $GROUP_RESPONSE | jq .
    exit 1
fi

echo -e "${GREEN}SUCCESS: Group created with UUID: ${GROUP_PK}${NC}"

echo -e "${BLUE}[2/3] Creating Client User: ${USERNAME}...${NC}"

# 2. Create User assigned to the group
USER_RESPONSE=$(curl -s -X POST "${AUTHENTIK_URL}/api/v3/core/users/" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"${USERNAME}\",
        \"name\": \"${FULL_NAME}\",
        \"email\": \"${EMAIL}\",
        \"attributes\": {},
        \"groups\": [\"${GROUP_PK}\"],
        \"path\": \"users\",
        \"type\": \"internal\",
        \"is_active\": true
    }")

USER_PK=$(echo $USER_RESPONSE | jq -r '.pk')

if [ "$USER_PK" == "null" ] || [ -z "$USER_PK" ]; then
    echo -e "${RED}Error creating user:${NC}"
    echo $USER_RESPONSE | jq .
    exit 1
fi

echo -e "${GREEN}SUCCESS: User created with UUID: ${USER_PK}${NC}"

echo -e "${BLUE}[3/3] Finalizing Provisioning...${NC}"
echo -e "${GREEN}--------------------------------------------------${NC}"
echo -e "${GREEN}Provisioning Complete for ${CLIENT_NAME}${NC}"
echo -e "Group: ${CLIENT_NAME} (binds to ${INSTANCE_URL})"
echo -e "User: ${USERNAME} (${EMAIL})"
echo -e "${GREEN}--------------------------------------------------${NC}"
echo -e "The user can now log in at https://napp.marcoby.net and will be redirected to ${INSTANCE_URL}"
