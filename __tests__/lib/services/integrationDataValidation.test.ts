import { supabase } from '@/lib/supabase';

const STANDARD_COLUMNS = [
  'id',
  'user_id',
  'integration_id',
  'source_id',
  'raw_json',
  'created_at',
  'updated_at',
  'synced_at',
  'external_url',
  'status',
  'tags',
];

const TABLES = [
  'integration_email',
  'integration_ticket',
  'integration_task',
  // Add more integration tables as needed
];

const LEGACY_COLUMNS = [
  // Example legacy columns to check for removal
  'subject', 'body', 'from_email', 'to_email', // for email
  'ticket_number', 'priority', // for ticket
  'task_name', 'due_date', // for task
];

describe('Integration Data Table Standardization', () => {
  TABLES.forEach((table) => {
    it(`${table} should have only standard columns`, async () => {
      const { data, error } = await supabase.rpc('get_table_columns', { table_name: table });
      if (error) throw error;
      const columns = data.map((row: any) => row.column_name);
      // Check all standard columns are present
      STANDARD_COLUMNS.forEach(col => {
        expect(columns).toContain(col);
      });
      // Check no legacy columns are present
      LEGACY_COLUMNS.forEach(legacyCol => {
        expect(columns).not.toContain(legacyCol);
      });
    });
  });
}); 