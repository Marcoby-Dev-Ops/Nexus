"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const assessmentCategories = [
    { id: 'SA', name: 'Sales', goal: 'Consistent pipeline + predictable close rates', weight: 20 },
    { id: 'FI', name: 'Finance', goal: 'Healthy cash flow + profitability', weight: 20 },
    { id: 'SU', name: 'Support', goal: 'Delight customers post-sale', weight: 15 },
    { id: 'MA', name: 'Maturity', goal: 'Scalable people/process foundation', weight: 15 },
    { id: 'MK', name: 'Marketing', goal: 'Efficient lead generation & brand reach', weight: 15 },
    { id: 'OP', name: 'Operations', goal: 'Lean, automated delivery engine', weight: 15 },
];
const assessmentQuestions = [
    // Sales
    { id: 'SA-01', category_id: 'SA', prompt: 'Do you track deals in a CRM?', question_type: 'bool', integration_check: 'HubSpot/Salesforce API', marcovy_angle: 'Pulse – CRM setup', offer_slug: 'crm-setup' },
    { id: 'SA-02', category_id: 'SA', prompt: 'Avg. sales cycle length (days)', question_type: 'number', integration_check: 'CRM "time-to-close"', marcovy_angle: 'Nexus – Win-loss analytics', offer_slug: 'win-loss-analytics' },
    { id: 'SA-03', category_id: 'SA', prompt: '% of leads from referrals', question_type: 'number', integration_check: 'CRM source field', marcovy_angle: 'Catalyst – Referral automation', offer_slug: 'referral-automation' },
    // Finance
    { id: 'FI-01', category_id: 'FI', prompt: 'Do you maintain a rolling 12-mo cash-flow forecast?', question_type: 'bool', integration_check: 'QuickBooks / Xero API', marcovy_angle: 'Catalyst – Virtual CFO', offer_slug: 'virtual-cfo' },
    { id: 'FI-02', category_id: 'FI', prompt: 'Net profit margin last Q (%)', question_type: 'number', integration_check: 'Accounting API', marcovy_angle: 'Nexus – Finance dashboard', offer_slug: 'finance-dashboard' },
    { id: 'FI-03', category_id: 'FI', prompt: 'Days Sales Outstanding (DSO)', question_type: 'number', integration_check: 'AR aging report', marcovy_angle: 'Pulse – Invoice automation', offer_slug: 'invoice-automation' },
    // Support
    { id: 'SU-01', category_id: 'SU', prompt: 'Primary ticketing system in place?', question_type: 'enum', options: { "Zendesk": 100, "Freshdesk": 70, "None": 0 }, integration_check: 'API ping', marcovy_angle: 'Pulse – Help desk rollout', offer_slug: 'help-desk-rollout' },
    { id: 'SU-02', category_id: 'SU', prompt: 'Avg. first-reply time (min)', question_type: 'number', integration_check: 'Ticketing metrics', marcovy_angle: 'Catalyst – Support SLA mgmt', offer_slug: 'support-sla-mgmt' },
    { id: 'SU-03', category_id: 'SU', prompt: 'CSAT score last 90 days', question_type: 'number', integration_check: 'NPS/CSAT tool', marcovy_angle: 'Nexus – Voice-of-customer AI', offer_slug: 'voice-of-customer-ai' },
    // Maturity
    { id: 'MA-01', category_id: 'MA', prompt: 'Org chart documented & current?', question_type: 'bool', integration_check: 'HRIS / Drive check', marcovy_angle: 'Catalyst – HR process design', offer_slug: 'hr-process-design' },
    { id: 'MA-02', category_id: 'MA', prompt: '% of core procedures SOP-ready', question_type: 'number', integration_check: 'Confluence / Notion pages', marcovy_angle: 'Pulse – SOP templating', offer_slug: 'sop-templating' },
    { id: 'MA-03', category_id: 'MA', prompt: 'Formal quarterly planning cadence?', question_type: 'bool', integration_check: 'Calendar scan / interview', marcovy_angle: 'Nexus – OKR module', offer_slug: 'okr-module' },
    // Marketing
    { id: 'MK-01', category_id: 'MK', prompt: 'Marketing automation platform?', question_type: 'enum', options: { "HubSpot": 100, "Mailchimp": 70, "None": 0 }, integration_check: 'API', marcovy_angle: 'Pulse – MA platform', offer_slug: 'ma-platform' },
    { id: 'MK-02', category_id: 'MK', prompt: 'Lead-to-MQL conversion rate (%)', question_type: 'number', integration_check: 'MA/CRM funnel', marcovy_angle: 'Nexus – Funnel optimizer', offer_slug: 'funnel-optimizer' },
    { id: 'MK-03', category_id: 'MK', prompt: 'Website sessions MoM growth', question_type: 'number', integration_check: 'GA4 API', marcovy_angle: 'Catalyst – SEO/Content', offer_slug: 'seo-content' },
    // Operations
    { id: 'OP-01', category_id: 'OP', prompt: '% of repeatable tasks automated', question_type: 'number', integration_check: 'n8n run stats', marcovy_angle: 'Nexus – Workflow library', offer_slug: 'workflow-library' },
    { id: 'OP-02', category_id: 'OP', prompt: 'Avg. project on-time delivery (%)', question_type: 'number', integration_check: 'Asana / Jira', marcovy_angle: 'Catalyst – PMO advisory', offer_slug: 'pmo-advisory' },
    { id: 'OP-03', category_id: 'OP', prompt: 'Utilization rate (hrs billed ÷ capacity)', question_type: 'number', integration_check: 'Harvest / Tempo', marcovy_angle: 'Pulse – Resource planning', offer_slug: 'resource-planning' },
];
const offers = [
    { slug: 'crm-setup', solution: 'HubSpot + onboarding', division: 'Pulse' },
    { slug: 'win-loss-analytics', solution: 'Win-loss analytics', division: 'Nexus' },
    { slug: 'referral-automation', solution: 'Referral automation', division: 'Catalyst' },
    { slug: 'virtual-cfo', solution: 'Virtual CFO svc', division: 'Catalyst' },
    { slug: 'finance-dashboard', solution: 'Finance dashboard', division: 'Nexus' },
    { slug: 'invoice-automation', solution: 'Invoice automation', division: 'Pulse' },
    { slug: 'help-desk-rollout', solution: 'Help desk rollout', division: 'Pulse' },
    { slug: 'support-sla-mgmt', solution: 'Support SLA mgmt', division: 'Catalyst' },
    { slug: 'voice-of-customer-ai', solution: 'Voice-of-customer AI', division: 'Nexus' },
    { slug: 'hr-process-design', solution: 'HR process design', division: 'Catalyst' },
    { slug: 'sop-templating', solution: 'SOP templating', division: 'Pulse' },
    { slug: 'okr-module', solution: 'OKR module', division: 'Nexus' },
    { slug: 'ma-platform', solution: 'MA platform', division: 'Pulse' },
    { slug: 'funnel-optimizer', solution: 'Funnel optimizer', division: 'Nexus' },
    { slug: 'seo-content', solution: 'SEO/Content', division: 'Catalyst' },
    { slug: 'workflow-library', solution: 'Workflow library', division: 'Nexus' },
    { slug: 'pmo-advisory', solution: 'PMO advisory', division: 'Catalyst' },
    { slug: 'resource-planning', solution: 'Resource planning', division: 'Pulse' }
];
async function main() {
    console.log('Start seeding...');
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
            where: { slug: offer.slug },
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
                offer_slug: question.offer_slug,
            },
        });
    }
    console.log('Questions seeded.');
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
