Normalize industry migration

This script normalizes industry values for `companies.industry` and `companies.business_identity.foundation.industry`.

Files
- `scripts/normalize-industry.js` - Node script that performs a dry-run (default) and can apply updates with `--apply`.

Usage
1. Install dependencies (if not present):
   - The script uses the `pg` package. Install with `pnpm i -w pg` or in your environment.

2. Run a dry-run to preview changes:

```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname node scripts/normalize-industry.js --dry-run
```

3. If the results look correct, run with `--apply` to commit changes:

```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname node scripts/normalize-industry.js --apply
```

What it does
- For each company with either a non-empty `industry` or a `business_identity` JSONB, the script:
  - Computes a canonical industry using the same mapping/option set as the app code.
  - Prefers the identity's industry if present, otherwise uses the company top-level `industry`.
  - Updates `companies.industry` and/or `companies.business_identity->foundation->industry` to the canonical value when they differ.

Safety and notes
- The script works in `--dry-run` mode by default. No DB changes are made unless `--apply` is passed.
- Back up your database before running `--apply` in production.
- The canonical list and NAICS mapping are embedded in the script. If you change them in the app, keep the script in sync.

If you'd like, I can:
- Add a migration in SQL or a managed migration format (eg. node-pg-migrate) for your deployment process.
- Run the script for you if you provide DB access or run it in your environment and share results.
