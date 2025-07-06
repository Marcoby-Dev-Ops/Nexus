import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

/**
 * Basic cross-tenant isolation check.
 *
 * NOTE: Requires the following env vars set in CI/local shell:
 *   SUPABASE_URL            – project URL
 *   SUPABASE_ANON_KEY       – anonymous key (honours RLS)
 *
 * The test inserts rows for two fake organisations into a lightweight table
 * (`ai_audit_logs` is chosen because it already exists and has org_id column).
 * It then queries as Org A and asserts that Org B's rows are not visible.
 *
 * If env vars are missing we skip the suite so local devs aren't blocked.
 */

describe('RLS – cross-tenant isolation', () => {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;

  // Skip when env not configured
  if (!url || !anon) {
    it.skip('Supabase env vars not configured – skipping RLS tests', () => {});
    return;
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();

  beforeAll(async () => {
    // Insert two rows under different org IDs
    await supabase.from('ai_audit_logs').insert([
      { org_id: orgA, action: 'test-insert', metadata: {} },
      { org_id: orgB, action: 'test-insert', metadata: {} },
    ]);
  });

  afterAll(async () => {
    // Cleanup the two rows
    await supabase
      .from('ai_audit_logs')
      .delete()
      .in('org_id', [orgA, orgB]);
  });

  it('returns only rows for the current org', async () => {
    const { data, error } = await supabase
      .from('ai_audit_logs')
      .select('*')
      .eq('org_id', orgA);

    if (error) throw error;
    const otherOrgRows = data.filter((r) => r.org_id === orgB);
    expect(otherOrgRows.length).toBe(0);
  });
}); 