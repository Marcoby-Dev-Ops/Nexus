#!/usr/bin/env bash
set -euo pipefail

# Nexus deployment preflight check.
# Returns:
#   0 = PASS
#   1 = WARN (no hard failures, but risks exist)
#   2 = FAIL (minimum requirements not met)

MIN_VCPU="${MIN_VCPU:-4}"
MIN_RAM_GB="${MIN_RAM_GB:-8}"
MIN_DISK_FREE_GB="${MIN_DISK_FREE_GB:-120}"
MAX_LOAD_PER_CORE="${MAX_LOAD_PER_CORE:-0.80}"
MIN_MEM_AVAILABLE_PCT="${MIN_MEM_AVAILABLE_PCT:-20}"

PASS=0
WARN=0
FAIL=0

line() { printf '%s\n' "------------------------------------------------------------"; }
ok()   { printf 'PASS: %s\n' "$1"; PASS=$((PASS + 1)); }
warn() { printf 'WARN: %s\n' "$1"; WARN=$((WARN + 1)); }
fail() { printf 'FAIL: %s\n' "$1"; FAIL=$((FAIL + 1)); }

to_gb_from_kb() {
  awk -v kb="$1" 'BEGIN { printf "%.1f", kb / 1024 / 1024 }'
}

line
echo "Nexus Host Readiness Check"
date -u +"UTC time: %Y-%m-%d %H:%M:%S"
line
printf 'Thresholds: vCPU>=%s RAM>=%sGB FreeDisk>=%sGB MaxLoad/Core<=%s AvailMem>=%s%%\n' \
  "$MIN_VCPU" "$MIN_RAM_GB" "$MIN_DISK_FREE_GB" "$MAX_LOAD_PER_CORE" "$MIN_MEM_AVAILABLE_PCT"
line

# OS
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "OS: ${PRETTY_NAME:-unknown}"
  if [[ "${ID:-}" == "ubuntu" ]]; then
    ok "Ubuntu detected"
  else
    warn "Non-Ubuntu OS detected; validate Docker/kernel compatibility"
  fi
else
  warn "Cannot detect operating system"
fi

# CPU
VCPU="$(nproc --all 2>/dev/null || echo 0)"
echo "vCPU: $VCPU"
if (( VCPU >= MIN_VCPU )); then
  ok "vCPU meets minimum"
else
  fail "vCPU below minimum ($MIN_VCPU)"
fi

# RAM
MEM_TOTAL_KB="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
MEM_AVAIL_KB="$(awk '/MemAvailable/ {print $2}' /proc/meminfo)"
MEM_TOTAL_GB="$(to_gb_from_kb "$MEM_TOTAL_KB")"
MEM_AVAIL_GB="$(to_gb_from_kb "$MEM_AVAIL_KB")"
MEM_AVAIL_PCT="$(awk -v a="$MEM_AVAIL_KB" -v t="$MEM_TOTAL_KB" 'BEGIN { printf "%.0f", (a / t) * 100 }')"

printf 'RAM total: %s GB | available: %s GB (%s%%)\n' "$MEM_TOTAL_GB" "$MEM_AVAIL_GB" "$MEM_AVAIL_PCT"
if awk -v total="$MEM_TOTAL_GB" -v min="$MIN_RAM_GB" 'BEGIN { exit !(total >= min) }'; then
  ok "RAM meets minimum"
else
  fail "RAM below minimum (${MIN_RAM_GB}GB)"
fi

if (( MEM_AVAIL_PCT >= MIN_MEM_AVAILABLE_PCT )); then
  ok "Available memory is healthy for deployment"
else
  warn "Available memory is low right now (< ${MIN_MEM_AVAILABLE_PCT}%)"
fi

# Disk
DISK_FREE_KB="$(df -Pk / | awk 'NR==2 {print $4}')"
DISK_FREE_GB="$(awk -v kb="$DISK_FREE_KB" 'BEGIN { printf "%.1f", kb / 1024 / 1024 }')"
printf 'Disk free on /: %s GB\n' "$DISK_FREE_GB"
if awk -v free="$DISK_FREE_GB" -v min="$MIN_DISK_FREE_GB" 'BEGIN { exit !(free >= min) }'; then
  ok "Free disk meets minimum"
else
  fail "Free disk below minimum (${MIN_DISK_FREE_GB}GB)"
fi

# Load
LOAD1="$(awk '{print $1}' /proc/loadavg)"
LOAD_PER_CORE="$(awk -v loadval="$LOAD1" -v cores="$VCPU" 'BEGIN { if (cores == 0) cores = 1; printf "%.2f", loadval / cores }')"
printf 'Load (1m): %s | load/core: %s\n' "$LOAD1" "$LOAD_PER_CORE"
if awk -v lpc="$LOAD_PER_CORE" -v max="$MAX_LOAD_PER_CORE" 'BEGIN { exit !(lpc <= max) }'; then
  ok "Current load is within safe range"
else
  warn "Current load/core exceeds ${MAX_LOAD_PER_CORE}; retry check during off-peak"
fi

# Docker
if command -v docker >/dev/null 2>&1; then
  if DOCKER_VERSION="$(docker --version 2>/dev/null)"; then
    ok "Docker installed (${DOCKER_VERSION})"
  else
    warn "Docker CLI exists but is not usable for current user/session"
  fi

  if docker info >/dev/null 2>&1; then
    ok "Docker daemon reachable"
  else
    warn "Docker installed but daemon not reachable for current user"
  fi
else
  fail "Docker is not installed"
fi

if docker compose version >/dev/null 2>&1; then
  ok "Docker Compose plugin available"
else
  warn "Docker Compose plugin missing"
fi

# Basic network
if ping -c1 -W2 1.1.1.1 >/dev/null 2>&1; then
  ok "Outbound network reachable"
else
  warn "Outbound network check failed"
fi

# Helpful port visibility snapshot
if command -v ss >/dev/null 2>&1; then
  echo "Listening ports snapshot (first 15):"
  ss -tulpn 2>/dev/null | head -n 15 || true
fi

line
TOTAL=$((PASS + WARN + FAIL))
printf 'Results: PASS=%s WARN=%s FAIL=%s (checks=%s)\n' "$PASS" "$WARN" "$FAIL" "$TOTAL"

if (( FAIL > 0 )); then
  echo "READINESS: FAIL"
  exit 2
fi

if (( WARN > 0 )); then
  echo "READINESS: WARN"
  exit 1
fi

echo "READINESS: PASS"
exit 0
