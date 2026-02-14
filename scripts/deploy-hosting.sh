#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

HOST=""
USER=""
REMOTE_DIR=""
DELETE_FLAG="--delete"

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy-hosting.sh --host <hostname> --user <ssh_user> --remote-dir <remote_path> [options]

Required:
  --host            Remote host (e.g. landing.marcoby.cloud)
  --user            SSH user
  --remote-dir      Target directory on host

Optional:
  --api-url         Value for VITE_API_URL
  --auth-url        Value for VITE_AUTHENTIK_URL
  --auth-client-id  Value for VITE_AUTHENTIK_CLIENT_ID
  --portal-url      Value for VITE_APP_PORTAL_URL (e.g. https://napp.marcoby.net)
  --no-delete       Do not pass --delete to rsync
  -h, --help        Show this help
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo -e "${RED}Missing required command: $1${NC}"
    exit 1
  fi
}

prompt_env_if_missing() {
  local var_name=$1
  local prompt_text=$2
  local current_value=${!var_name-}
  if [ -z "$current_value" ]; then
    read -r -p "$prompt_text: " input_value
    export "$var_name=$input_value"
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --host)
      HOST=${2-}
      shift 2
      ;;
    --user)
      USER=${2-}
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR=${2-}
      shift 2
      ;;
    --api-url)
      export VITE_API_URL=${2-}
      shift 2
      ;;
    --auth-url)
      export VITE_AUTHENTIK_URL=${2-}
      shift 2
      ;;
    --auth-client-id)
      export VITE_AUTHENTIK_CLIENT_ID=${2-}
      shift 2
      ;;
    --portal-url)
      export VITE_APP_PORTAL_URL=${2-}
      shift 2
      ;;
    --no-delete)
      DELETE_FLAG=""
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      exit 1
      ;;
  esac
done

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$REMOTE_DIR" ]; then
  echo -e "${RED}Missing required arguments.${NC}"
  usage
  exit 1
fi

require_cmd pnpm
require_cmd rsync
require_cmd ssh

echo -e "${BLUE}Starting landing deployment...${NC}"
echo -e "${YELLOW}Preparing production environment variables...${NC}"

prompt_env_if_missing "VITE_API_URL" "Enter Backend API URL (e.g. https://api.yourcompany.com)"
prompt_env_if_missing "VITE_AUTHENTIK_URL" "Enter Authentik URL (e.g. https://auth.yourcompany.com)"
prompt_env_if_missing "VITE_AUTHENTIK_CLIENT_ID" "Enter Authentik Client ID"
prompt_env_if_missing "VITE_APP_PORTAL_URL" "Enter App Portal URL (e.g. https://napp.marcoby.net)"

export VITE_FORCE_CROSS_ORIGIN_API=true
export VITE_LANDING_ONLY=true

echo -e "${BLUE}Building client bundle...${NC}"
pnpm --dir client run build
echo -e "${GREEN}Build completed.${NC}"

echo -e "${BLUE}Ensuring remote directory exists...${NC}"
ssh "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

echo -e "${BLUE}Uploading files to $USER@$HOST:$REMOTE_DIR ...${NC}"
rsync -avz ${DELETE_FLAG} client/dist/ "$USER@$HOST:$REMOTE_DIR"

echo -e "${GREEN}Deployment complete.${NC}"
echo -e "Public host: https://$HOST"
