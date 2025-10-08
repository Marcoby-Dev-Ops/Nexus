# User Purge Guide

This guide explains how to safely remove a user and all of their related data from the Nexus database so you can test a fresh provisioning/onboarding flow (e.g. new Authentik attribute mapping, company creation logic, etc.).

## Overview

The purge script:

- Accepts lookup by `--user-id` (Authentik subject / `user_profiles.user_id`) or by `--email` (matches `email`, `business_email`, or `personal_email`).
- Performs a dry-run by default (no data changed) showing counts per related table.
- Requires `--confirm` to actually delete.
- Optionally deletes companies the user owns (`companies.owner_id = user_id`) when `--delete-owned-companies` is passed.
- Aborts if multiple user profiles match an email unless `--force-multi` is supplied.
- Executes all deletions inside a single transaction; any error rolls everything back.
- Handles optional tables gracefully (skips if a table is absent in the environment).

## Location

Script path: `server/scripts/purge-user.js`

NPM convenience command:

```bash
pnpm purge-user -- --email="user@example.com"
```

(Note the `--` separator so flags are passed to the script.)

## Usage Examples

Dry-run by email:

```bash
pnpm purge-user -- --email="user@example.com"
```

Purge by Authentik user id:

```bash
pnpm purge-user -- --user-id=AUTH_SUB --confirm
```

Include owned companies (will delete the company rows and cascading members):

```bash
pnpm purge-user -- --user-id=AUTH_SUB --confirm --delete-owned-companies
```

Multiple matches (same email reused) – force:

```bash
pnpm purge-user -- --email="shared@example.com" --confirm --force-multi
```

Machine-readable JSON summary (good for automation):

```bash
pnpm purge-user -- --email="user@example.com" --json
```

## Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--user-id` | Exact Authentik subject (`user_profiles.user_id`) | - |
| `--email` | Match on any email field (lowercased) | - |
| `--confirm` | Perform deletion (otherwise dry-run) | `false` |
| `--delete-owned-companies` | Delete companies where user is `owner_id` | `false` |
| `--force-multi` | Allow purge if multiple matches | `false` |
| `--json` | Output JSON only | `false` |
| `--connection` | Override connection string (otherwise env or local default) | - |

## What Gets Deleted

Ordered to satisfy dependencies (child records first):

1. `ai_messages` (conversation scoped)
2. `ai_message_attachments` (optional table)
3. `ai_conversations`
4. `ai_memories`
5. `oauth_tokens`
6. `user_integrations`
7. `business_health_snapshots`
8. `onboarding_progress`
9. `company_members`
10. `user_preferences`
11. `user_organizations`
12. `user_profiles` (final removal)
13. (Optional) `companies` where `owner_id = user_id` (if flag provided)

Tables are enumerated in the script; if your schema adds new user‑scoped tables, update `userRelatedTables` in `purge-user.js`.

## Safety Notes

- Always run a dry-run first. Validate targeted user id and row counts.
- Consider taking a database snapshot/backup before purging production data.
- Purging is irreversible. If you need auditability, implement a soft-delete or anonymization variant instead.
- The script does not currently anonymize references that may exist in historical analytic/event tables (none are defined yet in base schema). Add logic as those tables emerge.

## Common Scenarios

### Re-running provisioning for a single test user

1. Log the Authentik subject (sub) or note the email used.
2. Dry-run: `pnpm purge-user -- --email="dev+test@example.com"`
3. Purge: `pnpm purge-user -- --email="dev+test@example.com" --confirm --delete-owned-companies`
4. Initiate a fresh login via the frontend to trigger clean provisioning.

### Multiple matches on the same email

If multiple `user_profiles` rows share the same email (rare; may indicate data quality issue), decide whether all should be removed. If yes, add `--force-multi`.

### Just want to inspect planned deletions programmatically

Use `--json` without `--confirm` to integrate into CI or scripted maintenance tooling.

## Extending the Script

Add new user-scoped tables in the array near the top of `purge-user.js`. Follow the pattern:

```js
{ table: 'new_table', where: 'user_id = $1', key: 'new_table' }
```

If the table is optional (may not exist everywhere), include `optional: true`.

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|-----------|
| "No matching users found" | Wrong identifier/email | Verify Authentik sub or email in DB (`SELECT user_id,email FROM user_profiles`) |
| Exit code 3 | Multiple matches and no `--force-multi` | Add `--force-multi` or refine criteria |
| Relation does not exist (non-fatal) | Optional table missing | Safe to ignore; script logs zero / n/a |
| Connection refused | DB not running / wrong URL | Export `DATABASE_URL` or pass `--connection` |

## Future Enhancements (Ideas)

- `--anonymize` mode: scramble PII instead of deleting
- `--backup` flag to export matched rows as JSON before purge
- Automatic detection of new user_* tables via information_schema
- Soft-delete flag storing tombstone records

---
**Last Updated:** (auto-generated alongside script creation)

Happy testing! Purging a user gives you a clean slate to ensure provisioning logic behaves exactly as intended.
