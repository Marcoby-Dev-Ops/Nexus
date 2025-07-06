import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const assessmentCategories = [
  { id: 'FD', name: 'Foundations', goal: 'Establish the core identity of the business', weight: 10 },
  { id: 'SA', name: 'Sales', goal: 'Consistent pipeline + predictable close rates', weight: 20 },
  { id: 'FI', name: 'Finance', goal: 'Healthy cash flow + profitability', weight: 20 },
  { id: 'SU', name: 'Support', goal: 'Delight customers post-sale', weight: 15 },
  { id: 'MA', name: 'Maturity', goal: 'Scalable people/process foundation', weight: 15 },
  { id: 'MK', name: 'Marketing', goal: 'Efficient lead generation & brand reach', weight: 15 },
  { id: 'OP', name: 'Operations', goal: 'Lean, automated delivery engine', weight: 15 },
];

const assessmentQuestions = [
  // Foundations
  { id: 'FD-01', category_id: 'FD', prompt: 'What is your company website?', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Core company profile', action_type: 'UPDATE_PROFILE', target_field: 'website', offer_id: null },
  { id: 'FD-02', category_id: 'FD', prompt: 'When was the company founded?', question_type: 'date', integration_check: 'manual', marcovy_angle: 'Core company profile', action_type: 'UPDATE_PROFILE', target_field: 'founded', offer_id: null },
  { id: 'FD-03', category_id: 'FD', prompt: 'Provide a short description of your company.', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Core company profile', action_type: 'UPDATE_PROFILE', target_field: 'description', offer_id: null },
  { id: 'FD-04', category_id: 'FD', prompt: 'What is your Dun & Bradstreet number (if any)?', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Business credit and identity', action_type: 'UPDATE_PROFILE', target_field: 'duns_number', offer_id: null },
  { id: 'FD-05', category_id: 'FD', prompt: 'What is your main business phone number?', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Contact and identity', action_type: 'UPDATE_PROFILE', target_field: 'business_phone', offer_id: null },
  { id: 'FD-06', category_id: 'FD', prompt: 'What system do you use for inventory management?', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Operational maturity', action_type: 'UPDATE_PROFILE', target_field: 'inventory_management_system', offer_id: null },
  { id: 'FD-07', category_id: 'FD', prompt: 'Briefly describe your primary client base.', question_type: 'text', integration_check: 'manual', marcovy_angle: 'Market positioning', action_type: 'UPDATE_PROFILE', target_field: 'client_base_description', offer_id: null },
  
  // Sales
  { id: 'SA-01', category_id: 'SA', prompt: 'Do you track deals in a CRM?', question_type: 'bool', integration_check: 'HubSpot/Salesforce API', marcovy_angle: 'Pulse – CRM setup', offer_id: 'crm-setup', action_type: 'SCORE', target_field: null },
  { id: 'SA-02', category_id: 'SA', prompt: 'Avg. sales cycle length (days)', question_type: 'number', integration_check: 'CRM "time-to-close"', marcovy_angle: 'Nexus – Win-loss analytics', offer_id: 'win-loss-analytics', action_type: 'SCORE', target_field: null },
  { id: 'SA-03', category_id: 'SA', prompt: '% of leads from referrals', question_type: 'number', integration_check: 'CRM source field', marcovy_angle: 'Catalyst – Referral automation', offer_id: 'referral-automation', action_type: 'SCORE', target_field: null },
  // Finance
  { id: 'FI-01', category_id: 'FI', prompt: 'Do you maintain a rolling 12-mo cash-flow forecast?', question_type: 'bool', integration_check: 'QuickBooks / Xero API', marcovy_angle: 'Catalyst – Virtual CFO', offer_id: 'virtual-cfo', action_type: 'SCORE', target_field: null },
  { id: 'FI-02', category_id: 'FI', prompt: 'Net profit margin last Q (%)', question_type: 'number', integration_check: 'Accounting API', marcovy_angle: 'Nexus – Finance dashboard', offer_id: 'finance-dashboard', action_type: 'SCORE', target_field: null },
  { id: 'FI-03', category_id: 'FI', prompt: 'Days Sales Outstanding (DSO)', question_type: 'number', integration_check: 'AR aging report', marcovy_angle: 'Pulse – Invoice automation', offer_id: 'invoice-automation', action_type: 'SCORE', target_field: null },
  // Support
  { id: 'SU-01', category_id: 'SU', prompt: 'Primary ticketing system in place?', question_type: 'enum', options: { "Zendesk": 100, "Freshdesk": 70, "None": 0 }, integration_check: 'API ping', marcovy_angle: 'Pulse – Help desk rollout', offer_id: 'help-desk-rollout', action_type: 'SCORE', target_field: null },
  { id: 'SU-02', category_id: 'SU', prompt: 'Avg. first-reply time (min)', question_type: 'number', integration_check: 'Ticketing metrics', marcovy_angle: 'Catalyst – Support SLA mgmt', offer_id: 'support-sla-mgmt', action_type: 'SCORE', target_field: null },
  { id: 'SU-03', category_id: 'SU', prompt: 'CSAT score last 90 days', question_type: 'number', integration_check: 'NPS/CSAT tool', marcovy_angle: 'Nexus – Voice-of-customer AI', offer_id: 'voice-of-customer-ai', action_type: 'SCORE', target_field: null },
  // Maturity
  { id: 'MA-01', category_id: 'MA', prompt: 'Org chart documented & current?', question_type: 'bool', integration_check: 'HRIS / Drive check', marcovy_angle: 'Catalyst – HR process design', offer_id: 'hr-process-design', action_type: 'SCORE', target_field: null },
  { id: 'MA-02', category_id: 'MA', prompt: '% of core procedures SOP-ready', question_type: 'number', integration_check: 'Confluence / Notion pages', marcovy_angle: 'Pulse – SOP templating', offer_id: 'sop-templating', action_type: 'SCORE', target_field: null },
  { id: 'MA-03', category_id: 'MA', prompt: 'Formal quarterly planning cadence?', question_type: 'bool', integration_check: 'Calendar scan / interview', marcovy_angle: 'Nexus – OKR module', offer_id: 'okr-module', action_type: 'SCORE', target_field: null },
  // Marketing
  { id: 'MK-01', category_id: 'MK', prompt: 'Marketing automation platform?', question_type: 'enum', options: { "HubSpot": 100, "Mailchimp": 70, "None": 0 }, integration_check: 'API', marcovy_angle: 'Pulse – MA platform', offer_id: 'ma-platform', action_type: 'SCORE', target_field: null },
  { id: 'MK-02', category_id: 'MK', prompt: 'Lead-to-MQL conversion rate (%)', question_type: 'number', integration_check: 'MA/CRM funnel', marcovy_angle: 'Nexus – Funnel optimizer', offer_id: 'funnel-optimizer', action_type: 'SCORE', target_field: null },
  { id: 'MK-03', category_id: 'MK', prompt: 'Website sessions MoM growth', question_type: 'number', integration_check: 'GA4 API', marcovy_angle: 'Catalyst – SEO/Content', offer_id: 'seo-content', action_type: 'SCORE', target_field: null },
  // Operations
  { id: 'OP-01', category_id: 'OP', prompt: '% of repeatable tasks automated', question_type: 'number', integration_check: 'n8n run stats', marcovy_angle: 'Nexus – Workflow library', offer_id: 'workflow-library', action_type: 'SCORE', target_field: null },
  { id: 'OP-02', category_id: 'OP', prompt: 'Avg. project on-time delivery (%)', question_type: 'number', integration_check: 'Asana / Jira', marcovy_angle: 'Catalyst – PMO advisory', offer_id: 'pmo-advisory', action_type: 'SCORE', target_field: null },
  { id: 'OP-03', category_id: 'OP', prompt: 'Utilization rate (hrs billed ÷ capacity)', question_type: 'number', integration_check: 'Harvest / Tempo', marcovy_angle: 'Pulse – Resource planning', offer_id: 'resource-planning', action_type: 'SCORE', target_field: null },
];

const thoughts = [
  { content: 'We should explore a partnership with Acme Corp.' },
  { content: 'Launch a new marketing campaign for the Q3 product release.' },
];

const metrics = [
    { name: 'Monthly Recurring Revenue', description: 'The total amount of predictable revenue that a company can expect to receive on a monthly basis.', source: 'Stripe' },
    { name: 'Customer Churn Rate', description: 'The percentage of customers who cancel their subscriptions in a given period.', source: 'Manual' },
];

const workflows = [
    { id: 'wf-001', name: 'Onboard New Client', description: 'A series of steps to onboard a new client.', trigger: 'manual', config: { steps: ['Send welcome email', 'Schedule kick-off call', 'Create client folder in Google Drive'] } },
    { id: 'wf-002', name: 'Process Refund', description: 'Automated workflow to process a customer refund.', trigger: 'webhook', config: { steps: ['Verify refund request', 'Issue refund in Stripe', 'Send confirmation email'] } },
];

const offers = [
    { id: 'crm-setup', solution: 'HubSpot + onboarding', division: 'Pulse' },
    { id: 'win-loss-analytics', solution: 'Win-loss analytics', division: 'Nexus' },
    { id: 'referral-automation', solution: 'Referral automation', division: 'Catalyst' },
    { id: 'virtual-cfo', solution: 'Virtual CFO svc', division: 'Catalyst' },
    { id: 'finance-dashboard', solution: 'Finance dashboard', division: 'Nexus' },
    { id: 'invoice-automation', solution: 'Invoice automation', division: 'Pulse' },
    { id: 'help-desk-rollout', solution: 'Help desk rollout', division: 'Pulse' },
    { id: 'support-sla-mgmt', solution: 'Support SLA mgmt', division: 'Catalyst' },
    { id: 'voice-of-customer-ai', solution: 'Voice-of-customer AI', division: 'Nexus' },
    { id: 'hr-process-design', solution: 'HR process design', division: 'Catalyst' },
    { id: 'sop-templating', solution: 'SOP templating', division: 'Pulse' },
    { id: 'okr-module', solution: 'OKR module', division: 'Nexus' },
    { id: 'ma-platform', solution: 'MA platform', division: 'Pulse' },
    { id: 'funnel-optimizer', solution: 'Funnel optimizer', division: 'Nexus' },
    { id: 'seo-content', solution: 'SEO/Content', division: 'Catalyst' },
    { id: 'workflow-library', solution: 'Workflow library', division: 'Nexus' },
    { id: 'pmo-advisory', solution: 'PMO advisory', division: 'Catalyst' },
    { id: 'resource-planning', solution: 'Resource planning', division: 'Pulse' }
];

async function main() {
  console.log('Start seeding...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  console.log(`User ${user.name} seeded with ID: ${user.id}`);

  for (const category of assessmentCategories) {
    await prisma.assessmentCategory.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }
  console.log('Categories seeded.');

  for (const offer of offers) {
    await prisma.offer.upsert({
        where: { id: offer.id },
        update: {},
        create: offer,
    });
  }
  console.log('Offers seeded.');

  for (const question of assessmentQuestions) {
    await prisma.assessmentQuestion.upsert({
      where: { id: question.id },
      update: {},
      create: {
        id: question.id,
        prompt: question.prompt,
        question_type: question.question_type,
        options: question.options || undefined,
        integration_check: question.integration_check,
        marcovy_angle: question.marcovy_angle,
        category_id: question.category_id,
        offer_id: question.offer_id,
        action_type: question.action_type,
        target_field: question.target_field,
      },
    });
  }
  console.log('Questions seeded.');

  // Seeding for THINK, SEE, ACT modules
  console.log('Seeding THINK, SEE, ACT modules...');

  const userId = user.id; 

  for (const thought of thoughts) {
    await prisma.thought.create({
      data: {
        userId: userId,
        content: thought.content,
      }
    });
  }
  console.log('Thoughts seeded.');

  for (const metric of metrics) {
    await prisma.metric.upsert({
      where: { name: metric.name },
      update: {},
      create: metric,
    });
  }
  console.log('Metrics seeded.');

  for (const workflow of workflows) {
    await prisma.workflow.upsert({
      where: { id: workflow.id },
      update: {},
      create: workflow,
    });
  }
  console.log('Workflows seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 