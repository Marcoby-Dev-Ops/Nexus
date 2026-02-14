#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

CONFIG_PATH=""
DRY_RUN=false
SKIP_BUILD=false
VERIFY_AFTER_DEPLOY=true
VERIFY_URL_OVERRIDE=""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy-landing-ftp.sh [options]

Config:
  --config <path>     Path to deploy config env file
                     Default: scripts/.secrets/landing-ftp.env

Optional:
  --dry-run           Print actions but do not upload
  --skip-build        Skip landing build step
  --verify-url <url>  Override verification URL
  --no-verify         Skip verification request after upload
  -h, --help          Show help

Example:
  scripts/deploy-landing-ftp.sh --config scripts/.secrets/landing-ftp.env
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo -e "${RED}Missing command: $1${NC}"
    exit 1
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --config)
      CONFIG_PATH="${2-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --verify-url)
      VERIFY_URL_OVERRIDE="${2-}"
      shift 2
      ;;
    --no-verify)
      VERIFY_AFTER_DEPLOY=false
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

if [ -z "$CONFIG_PATH" ]; then
  DEFAULT_CONFIG_PATH="${REPO_ROOT}/scripts/.secrets/landing-ftp.env"
  if [ -f "$DEFAULT_CONFIG_PATH" ]; then
    CONFIG_PATH="$DEFAULT_CONFIG_PATH"
  else
    echo -e "${RED}Missing config. Pass --config or create scripts/.secrets/landing-ftp.env${NC}"
    usage
    exit 1
  fi
fi

if [ ! -f "$CONFIG_PATH" ]; then
  echo -e "${RED}Config file not found: $CONFIG_PATH${NC}"
  exit 1
fi

require_cmd pnpm
require_cmd curl
require_cmd python3

set -a
# shellcheck disable=SC1090
source "$CONFIG_PATH"
set +a

required_vars=(
  FTP_HOST
  FTP_USER
  FTP_PASSWORD
  FTP_REMOTE_DIR
  VITE_APP_PORTAL_URL
  LANDING_DOMAIN
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name-}" ]; then
    echo -e "${RED}Missing required config variable: $var_name${NC}"
    exit 1
  fi
done

FTP_SCHEME="${FTP_SCHEME:-ftp}"
FTP_USE_TLS="${FTP_USE_TLS:-true}"
VERIFY_URL="${VERIFY_URL:-https://${LANDING_DOMAIN}}"
if [ -n "$VERIFY_URL_OVERRIDE" ]; then
  VERIFY_URL="$VERIFY_URL_OVERRIDE"
fi
REMOTE_DIR="${FTP_REMOTE_DIR%/}"
if [ -z "$REMOTE_DIR" ]; then
  REMOTE_DIR="/"
fi

echo -e "${BLUE}Landing deploy target:${NC} ${LANDING_DOMAIN}"
echo -e "${BLUE}FTP host:${NC} ${FTP_HOST}"
echo -e "${BLUE}Remote dir:${NC} ${REMOTE_DIR}"

export VITE_LANDING_ONLY=true
export VITE_APP_PORTAL_URL
export VITE_IDENTITY_LOGIN_URL="${VITE_IDENTITY_LOGIN_URL:-}"
export VITE_IDENTITY_SIGNUP_URL="${VITE_IDENTITY_SIGNUP_URL:-}"
export VITE_ENABLE_MARKETING_ROUTES="${VITE_ENABLE_MARKETING_ROUTES:-true}"

if [ "$SKIP_BUILD" = false ]; then
  echo -e "${BLUE}Building landing bundle...${NC}"
  (cd "$REPO_ROOT" && pnpm --dir landing run build)
  echo -e "${GREEN}Build complete.${NC}"
else
  echo -e "${YELLOW}Skipping build (--skip-build).${NC}"
fi

if [ -f "$REPO_ROOT/landing/public/.htaccess" ] && [ ! -f "$REPO_ROOT/landing/dist/.htaccess" ]; then
  cp "$REPO_ROOT/landing/public/.htaccess" "$REPO_ROOT/landing/dist/.htaccess"
fi

DIST_DIR="$REPO_ROOT/landing/dist"
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Build output missing: $DIST_DIR${NC}"
  exit 1
fi

mapfile -t files < <(cd "$DIST_DIR" && find . -type f | sed 's#^\./##' | sort)
if [ "${#files[@]}" -eq 0 ]; then
  echo -e "${RED}No files found in $DIST_DIR${NC}"
  exit 1
fi

ordered_files=()
for rel_path in "${files[@]}"; do
  if [ "$rel_path" = "index.html" ] || [ "$rel_path" = ".htaccess" ]; then
    continue
  fi
  ordered_files+=("$rel_path")
done
for rel_path in "${files[@]}"; do
  if [ "$rel_path" = "index.html" ] || [ "$rel_path" = ".htaccess" ]; then
    ordered_files+=("$rel_path")
  fi
done
files=("${ordered_files[@]}")

build_curl_opts() {
  local -n out_opts=$1
  out_opts=(
    --silent
    --show-error
    --fail
    --retry 2
    --retry-delay 1
    --connect-timeout 20
    --max-time 120
    --user "${FTP_USER}:${FTP_PASSWORD}"
    --ftp-create-dirs
  )
  if [ "$FTP_USE_TLS" = "true" ]; then
    out_opts+=(--ssl-reqd)
  fi
}

url_encode_path() {
  local raw_path="$1"
  python3 - "$raw_path" <<'PY'
import sys
from urllib.parse import quote

raw = sys.argv[1]
print(quote(raw, safe="/._-"))
PY
}

upload_count=0
for rel_path in "${files[@]}"; do
  local_path="${DIST_DIR}/${rel_path}"
  encoded_rel_path="$(url_encode_path "${rel_path}")"
  remote_url="${FTP_SCHEME}://${FTP_HOST}${REMOTE_DIR}/${encoded_rel_path}"

  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] upload ${local_path} -> ${remote_url}"
    continue
  fi

  curl_opts=()
  build_curl_opts curl_opts
  curl "${curl_opts[@]}" -T "$local_path" "$remote_url"
  upload_count=$((upload_count + 1))
done

if [ "$DRY_RUN" = false ]; then
  echo -e "${GREEN}Uploaded ${upload_count} files.${NC}"
  if [ "$VERIFY_AFTER_DEPLOY" = true ]; then
    echo -e "${BLUE}Verifying:${NC} ${VERIFY_URL}"
    verify_status="$(curl -sS -o /dev/null -w '%{http_code}' "$VERIFY_URL" || true)"
    if [ "${verify_status}" = "200" ] || [ "${verify_status}" = "301" ] || [ "${verify_status}" = "302" ]; then
      echo -e "${GREEN}Verification status: ${verify_status}${NC}"
    else
      echo -e "${YELLOW}Verification returned HTTP ${verify_status}. Check DNS/SSL/hosting path.${NC}"
    fi
  else
    echo -e "${YELLOW}Verification skipped (--no-verify).${NC}"
  fi
else
  echo -e "${YELLOW}Dry run complete. No files were uploaded.${NC}"
fi
