# Landing FTP Deployment Workflow

Use this workflow to deploy the Nexus landing build to static hosting on `nexus.marcoby.com`.
Landing source now lives in `landing/` and is separate from the app frontend in `client/`.

## Agent trigger

If you ask an agent: `Deploy landing to Marcoby Cloud`, it should run:

```bash
bash scripts/deploy-landing-ftp.sh
```

## 1) Create local secret config

```bash
mkdir -p scripts/.secrets
cp scripts/landing-ftp.env.example scripts/.secrets/landing-ftp.env
```

Fill in real values in `scripts/.secrets/landing-ftp.env`.
For Marcoby identity flows, set:
- `VITE_IDENTITY_LOGIN_URL=https://identity.marcoby.com/if/flow/default-authentication-flow/`
- `VITE_IDENTITY_SIGNUP_URL=https://identity.marcoby.com/if/flow/nexus-enrollment-flow/?next=%2Flogin`

## 2) Dry run (no upload)

```bash
bash scripts/deploy-landing-ftp.sh --dry-run
```

## 3) Deploy

```bash
bash scripts/deploy-landing-ftp.sh
```

Equivalent npm script:

```bash
pnpm run deploy:landing:ftp
```

## 4) Verify site

Open `https://nexus.marcoby.com` and confirm:
- Landing renders.
- Login/signup links send users to `VITE_APP_PORTAL_URL`.
- Pricing/integrations section anchors work.

## Notes

- Default config path is `scripts/.secrets/landing-ftp.env`.
- Override config path with `--config <path>`.
- Skip build only if `landing/dist` is already fresh:

```bash
bash scripts/deploy-landing-ftp.sh --skip-build
```

- To skip HTTP verification after upload:

```bash
bash scripts/deploy-landing-ftp.sh --no-verify
```
