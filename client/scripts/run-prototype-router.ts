// Self-contained mock harness so this script can run without path alias resolution.

// Minimal `process` declaration so this script can compile without Node type defs
// (keeps this file self-contained; install `@types/node` in the client package
// if you prefer global Node typings).
declare const process: {
  exit(code?: number): never;
  env?: Record<string, string | undefined>;
};

type AgentSimple = { id: string; name: string; tags?: string[]; type?: string; department?: string };

const AGENTS: AgentSimple[] = [
  { id: 'executive-assistant', name: 'Executive Assistant', tags: ['strategy', 'leadership'] },
  { id: 'sales-director', name: 'Sales Director', tags: ['sales', 'pipeline'], department: 'sales' },
  { id: 'marketing-cmo', name: 'Marketing CMO', tags: ['marketing', 'campaigns'], department: 'marketing' },
  { id: 'finance-cfo', name: 'Finance CFO', tags: ['finance', 'budgeting'], department: 'finance' },
  { id: 'operations-director', name: 'Operations Director', tags: ['operations', 'efficiency'], department: 'operations' },
  { id: 'concierge-director', name: 'Concierge Director', tags: ['concierge', 'navigation'] },
];

async function mockRouteQuery(query: string): Promise<{ agentId: string; confidence: number; reasoning: string }> {
  const q = query.toLowerCase();

  for (const agent of AGENTS) {
    const name = (agent.name || '').toLowerCase();
    const tags = (agent.tags || []).map(t => t.toLowerCase());
    const dept = agent.department ? String(agent.department).toLowerCase() : '';

    if (q.includes(name) || tags.some(t => q.includes(t)) || (dept && q.includes(dept))) {
      return {
        agentId: agent.id,
        confidence: 0.85,
        reasoning: `Matched query keywords to agent "${agent.name}" (mock heuristic).`,
      };
    }
  }

  // fallback
  return { agentId: 'concierge-director', confidence: 0.45, reasoning: 'Default fallback (mock).' };
}

async function main() {
  const samples = [
    'How can I improve our sales pipeline conversion rates?',
    'Schedule a payroll update and review expenses for Q3',
    'Draft a marketing campaign brief for our new product launch',
    'What is the current status of cross-department initiatives?',
    'Help me with onboarding new hires in HR',
  ];

  for (const q of samples) {
    try {
      const r = await mockRouteQuery(q);
      console.log('Query:', q);
      console.log(' -> Agent:', r.agentId, 'confidence:', r.confidence.toFixed(2));
      console.log(' -> Reasoning:', r.reasoning);
      console.log('---');
    } catch (err) {
      console.error('Error routing query:', q, err);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
