Delete empty conversations helper

Usage:

  # Dry-run: list the conversations that would be deleted
  node scripts/delete-empty-conversations.js --dry-run --days=7

  # Delete (be careful): limit by userId or days
  node scripts/delete-empty-conversations.js --confirm --userId=<user-uuid> --days=30

Notes:
- Script reads DB connection from $DATABASE_URL or falls back to a local Postgres URL.
- It deletes both ai_messages (if any) and the ai_conversations row in a transaction.

Be sure to backup your DB before running destructive scripts in production.
