# Nexus Canonical Schema & RLS Policy Reference

## Overview
This document describes the standardized, secure schema and Row Level Security (RLS) policies for all core business data tables in the Nexus platform. It is intended for developers, security reviewers, and DevOps engineers.

---

## Standard Table Structure
All canonical tables use:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()` (auto-updated via trigger)
- `raw_json JSONB DEFAULT '{}'` (for flexible/legacy data)

---

## Canonical Tables & Purposes

| Table         | Purpose                                 | Ownership Level   |
|--------------|-----------------------------------------|-------------------|
| contacts     | CRM contacts for a company              | Company           |
| deals        | Sales deals/opportunities               | Company           |
| emails       | User emails (inbound/outbound)          | User              |
| tasks        | User tasks/todos                        | User              |
| notes        | User notes                              | User              |
| tickets      | Support/service tickets                 | User              |
| var_leads    | VAR (Value Added Reseller) leads        | User              |
| users        | User profiles/accounts                  | Self              |
| companies    | Company/organization records            | Admin/Service     |

---

## Relationships
- `contacts.company_id` → `companies.id`
- `deals.company_id` → `companies.id`
- `tasks.user_id`, `notes.user_id`, `tickets.user_id`, `var_leads.user_id`, `emails.user_id` → `users.id`
- `users.company_id` → `companies.id`

---

## RLS Policy Summary

### contacts, deals (Company-level)
- **SELECT/ALL:** Only users whose `company_id` matches the record’s `company_id` can access/modify.
- **Service role:** Full access.

### tasks, notes, tickets, var_leads, emails (User-level)
- **SELECT/ALL:** Only the user who owns the record (`user_id = auth.uid()`) can access/modify.
- **Service role:** Full access.

### users (Self-access)
- **SELECT/ALL:** Only the user can access/modify their own profile (`id = auth.uid()`).
- **Service role:** Full access.

### companies
- **ALL:** Only service role/admin can access/modify.

---

## Security Best Practices
- RLS is enabled on all tables by default.
- Service role bypass is provided for backend/admin operations only.
- All access is least-privilege by default.
- All changes to records update `updated_at` automatically.

---

## Onboarding Notes
- When adding new tables, follow the same naming, column, and RLS conventions.
- Review and test RLS policies after any schema change.
- For sensitive data, consider additional audit logging and field-level encryption as needed.

---

*For questions or security reviews, contact the Nexus platform engineering team.* 