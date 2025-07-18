import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

describe('RLS Security – Canonical Business Tables', () => {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service) {
    it.skip('Supabase env vars not configured – skipping RLS tests', () => {});
    return;
  }

  // Helper to create clients for different roles
  const supabaseUser = createClient(url, anon, { auth: { persistSession: false } });
  const supabaseService = createClient(url, service, { auth: { persistSession: false } });
  const supabaseUnauth = createClient(url, '', { auth: { persistSession: false } });

  // Test users and companies
  const companyA = uuidv4();
  const companyB = uuidv4();
  const userA = uuidv4();
  const userB = uuidv4();

  // Negative/edge case helpers
  async function expectForbidden(promise) {
    const { error } = await promise;
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/permission|denied|not allowed|forbidden/i);
  }

  // contacts (company-level)
  describe('contacts (company-level)', () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('contacts').insert({
        id: uuidv4(), company_id: companyA, user_id: userA, email: 'a@nexus.com', first_name: 'A', last_name: 'Test' }).select().single();
      const { data: b } = await supabaseService.from('contacts').insert({
        id: uuidv4(), company_id: companyB, user_id: userB, email: 'b@nexus.com', first_name: 'B', last_name: 'Test' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('contacts').delete().in('id', [recA.id, recB.id]);
    });
    it('user from companyA cannot update companyB contact', async () => {
      await expectForbidden(
        supabaseUser.from('contacts').update({ first_name: 'Hacker' }).eq('id', recB.id)
      );
    });
    it('user from companyA cannot delete companyB contact', async () => {
      await expectForbidden(
        supabaseUser.from('contacts').delete().eq('id', recB.id)
      );
    });
    it('user from companyA cannot escalate privilege (change company_id)', async () => {
      await expectForbidden(
        supabaseUser.from('contacts').update({ company_id: companyB }).eq('id', recA.id)
      );
    });
    it('unauthenticated user cannot access contacts', async () => {
      const { data, error } = await supabaseUnauth.from('contacts').select('*').eq('id', recA.id);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  // deals (company-level)
  describe('deals (company-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('deals').insert({
        id: uuidv4(), company_id: companyA, user_id: userA, name: 'Deal A', amount: 100 }).select().single();
      const { data: b } = await supabaseService.from('deals').insert({
        id: uuidv4(), company_id: companyB, user_id: userB, name: 'Deal B', amount: 200 }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('deals').delete().in('id', [recA.id, recB.id]);
    });
    it('user from companyA cannot see companyB deal', async () => {
      const { data, error } = await supabaseUser.from('deals').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('user from companyA can see their own deal', async () => {
      const { data, error } = await supabaseUser.from('deals').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all deals', async () => {
      const { data, error } = await supabaseService.from('deals').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // emails (user-level)
  describe('emails (user-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('emails').insert({
        id: uuidv4(), user_id: userA, subject: 'Email A', body: 'Body A' }).select().single();
      const { data: b } = await supabaseService.from('emails').insert({
        id: uuidv4(), user_id: userB, subject: 'Email B', body: 'Body B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('emails').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB email', async () => {
      const { data, error } = await supabaseUser.from('emails').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own email', async () => {
      const { data, error } = await supabaseUser.from('emails').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all emails', async () => {
      const { data, error } = await supabaseService.from('emails').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // tasks (user-level)
  describe('tasks (user-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('tasks').insert({
        id: uuidv4(), user_id: userA, title: 'Task A' }).select().single();
      const { data: b } = await supabaseService.from('tasks').insert({
        id: uuidv4(), user_id: userB, title: 'Task B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('tasks').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB task', async () => {
      const { data, error } = await supabaseUser.from('tasks').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own task', async () => {
      const { data, error } = await supabaseUser.from('tasks').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all tasks', async () => {
      const { data, error } = await supabaseService.from('tasks').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // notes (user-level)
  describe('notes (user-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('notes').insert({
        id: uuidv4(), user_id: userA, content: 'Note A' }).select().single();
      const { data: b } = await supabaseService.from('notes').insert({
        id: uuidv4(), user_id: userB, content: 'Note B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('notes').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB note', async () => {
      const { data, error } = await supabaseUser.from('notes').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own note', async () => {
      const { data, error } = await supabaseUser.from('notes').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all notes', async () => {
      const { data, error } = await supabaseService.from('notes').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // tickets (user-level)
  describe('tickets (user-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('tickets').insert({
        id: uuidv4(), user_id: userA, subject: 'Ticket A' }).select().single();
      const { data: b } = await supabaseService.from('tickets').insert({
        id: uuidv4(), user_id: userB, subject: 'Ticket B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('tickets').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB ticket', async () => {
      const { data, error } = await supabaseUser.from('tickets').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own ticket', async () => {
      const { data, error } = await supabaseUser.from('tickets').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all tickets', async () => {
      const { data, error } = await supabaseService.from('tickets').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // var_leads (user-level)
  describe('var_leads (user-level)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('var_leads').insert({
        id: uuidv4(), user_id: userA, lead_name: 'VARLead A' }).select().single();
      const { data: b } = await supabaseService.from('var_leads').insert({
        id: uuidv4(), user_id: userB, lead_name: 'VARLead B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('var_leads').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB var_lead', async () => {
      const { data, error } = await supabaseUser.from('var_leads').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own var_lead', async () => {
      const { data, error } = await supabaseUser.from('var_leads').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all var_leads', async () => {
      const { data, error } = await supabaseService.from('var_leads').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // users (self-access)
  describe('users (self-access)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('users').insert({
        id: userA, company_id: companyA, email: 'usera@nexus.com' }).select().single();
      const { data: b } = await supabaseService.from('users').insert({
        id: userB, company_id: companyB, email: 'userb@nexus.com' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('users').delete().in('id', [recA.id, recB.id]);
    });
    it('userA cannot see userB profile', async () => {
      const { data, error } = await supabaseUser.from('users').select('*').eq('id', recB.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('userA can see their own profile', async () => {
      const { data, error } = await supabaseUser.from('users').select('*').eq('id', recA.id);
      expect(error).toBeNull();
      expect(data && data.length).toBe(1);
    });
    it('service role can see all users', async () => {
      const { data, error } = await supabaseService.from('users').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });

  // companies (admin/service role only)
  describe('companies (admin/service role only)', async () => {
    let recA, recB;
    beforeAll(async () => {
      const { data: a } = await supabaseService.from('companies').insert({
        id: companyA, name: 'Company A' }).select().single();
      const { data: b } = await supabaseService.from('companies').insert({
        id: companyB, name: 'Company B' }).select().single();
      recA = a;
      recB = b;
    });
    afterAll(async () => {
      await supabaseService.from('companies').delete().in('id', [recA.id, recB.id]);
    });
    it('user cannot see any companies', async () => {
      const { data, error } = await supabaseUser.from('companies').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(0);
    });
    it('service role can see all companies', async () => {
      const { data, error } = await supabaseService.from('companies').select('*').in('id', [recA.id, recB.id]);
      expect(error).toBeNull();
      expect(data && data.length).toBe(2);
    });
  });
}); 