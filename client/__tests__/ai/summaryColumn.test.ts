describe('DB – summary_chunks column presence', () => {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;

  if (!url || !anon) {
    it.skip('Supabase env vars not configured – skipping summary column test', () => {});
    return;
  }

  it('ai_conversations.summary_chunks exists and is selectable', async () => {
    const endpoint = `${url}/rest/v1/ai_conversations?select=summary_chunks&limit=1`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    // Row may be empty, but request should not error, and each row should have summary_chunks key
    if (json.length > 0) {
      expect(json[0]).toHaveProperty('summary_chunks');
    }
  });
}); 