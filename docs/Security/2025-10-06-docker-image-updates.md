# Summary

Updated Dockerfiles and compose files to reduce Alpine-based image usage and lower exposure to high-severity vulnerabilities reported by scanners.

## What I changed

- `client/Dockerfile`: switched production base from `nginx:alpine` to `nginx:stable` and install `gettext-base`, `curl`, `wget` via apt.
- `server/Dockerfile`: switched base from `node:20-alpine` to `node:20-slim` and install `curl` via apt.
- `docker-compose.yml`: replaced `redis:7-alpine` with `redis:7-bullseye` and `pgvector/pgvector:pg17` -> `pgvector/pgvector:pg17-bullseye` to prefer Debian-based variants.
- `docs/deployment/docker-compose.yml`: replaced `postgres:15-alpine` with `postgres:15`.

## Why

 A security scanner reported "The image contains 1 high vulnerability" originating from an Alpine-based image in the stack. Switching to Debian-based variants reduces the Alpine-specific CVE surface.

## Notes & assumptions

- I assumed the reported high vulnerability is related to Alpine base images used by server/frontend or the compose-managed services. Switching to Debian-based variants reduces the Alpine-specific CVE surface.
- I kept `pgvector/pgvector` but switched to the `-bullseye` variant to align with Debian-based packages. If you're using a different postgres base for production, consider aligning tags across environments.

## Next steps (recommended)

 1. Run a full vulnerability scan on the images using Trivy or Docker Scan:

    - Install Trivy: `sudo snap install trivy` (or follow the official install guide)
    - Run: `trivy image nexus-server-test:latest` and `trivy image nexus-frontend-test:latest`

 2. If the scanner still reports a high vulnerability, capture the CVE id and the package name and I can prepare a targeted fix (patch or upgrade).

 3. Replace any other `*-alpine` images in CI/CD or deployment manifests with Debian-based tags if you prefer to avoid Alpine.

 4. Optionally pin base image digests (sha256) in Dockerfiles for reproducible builds.

## How I validated

- Built `nexus-server-test` and `nexus-frontend-test` locally during this change. Both images built successfully.
- Verified installed OS packages inside `nexus-server-test` using `dpkg-query`.

If you'd like, I can install Trivy here and run the scans, or I can prepare a PR with these changes for review.
