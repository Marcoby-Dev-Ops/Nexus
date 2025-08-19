#!/usr/bin/env node

/**
 * Demo Data Seeding Script
 * Seeds realistic demo data for demo accounts and organizations
 * Run this script to populate demo accounts with meaningful business data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo user data
const demoUsers = [
  {
    id: 'demo_user_1',
    email: 'demo@nexus.com',
    first_name: 'Demo',
    last_name: 'User',
    display_name: 'Demo Entrepreneur',
    role: 'owner',
    organization_id: 'demo_org_1'
  },
  {
    id: 'demo_user_2',
    email: 'demo2@nexus.com',
    first_name: 'Demo',
    last_name: 'Manager',
    display_name: 'Demo Manager',
    role: 'manager',
    organization_id: 'demo_org_2'
  }
];

// Demo organization data
const demoOrganizations = [
  {
    id: 'demo_org_1',
    name: 'Demo Tech Startup',
    description: 'A technology startup focused on AI solutions',
    industry: 'Technology',
    size: '10-50',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo_org_2',
    name: 'Demo Consulting Firm',
    description: 'Business consulting and strategy services',
    industry: 'Consulting',
    size: '5-10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Demo financial data
const generateDemoFinancialData = (userId, orgId) => {
  const baseRevenue = 50000 + Math.random() * 150000;
  const expenses = baseRevenue * (0.6 + Math.random() * 0.3);
  const profitMargin = ((baseRevenue - expenses) / baseRevenue) * 100;
  
  return [
    {
      id: `demo_financial_${userId}_1`,
      user_id: userId,
      organization_id: orgId,
      data_type: 'revenue',
      amount: Math.round(baseRevenue),
      date: new Date().toISOString(),
      description: 'Monthly revenue',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `demo_financial_${userId}_2`,
      user_id: userId,
      organization_id: orgId,
      data_type: 'expense',
      amount: Math.round(expenses),
      date: new Date().toISOString(),
      description: 'Monthly expenses',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `demo_financial_${userId}_3`,
      user_id: userId,
      organization_id: orgId,
      data_type: 'profit',
      amount: Math.round(baseRevenue - expenses),
      date: new Date().toISOString(),
      description: 'Monthly profit',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

// Demo integration data
const generateDemoIntegrations = (userId, orgId) => {
  const integrations = [
    {
      name: 'HubSpot CRM',
      type: 'crm',
      status: 'active',
      category: 'sales'
    },
    {
      name: 'Stripe Payments',
      type: 'payment',
      status: 'active',
      category: 'finance'
    },
    {
      name: 'Mailchimp',
      type: 'email',
      status: 'active',
      category: 'marketing'
    },
    {
      name: 'Slack',
      type: 'communication',
      status: 'active',
      category: 'communication'
    },
    {
      name: 'QuickBooks',
      type: 'accounting',
      status: 'active',
      category: 'finance'
    },
    {
      name: 'Google Analytics',
      type: 'analytics',
      status: 'active',
      category: 'marketing'
    }
  ];

  return integrations.map((integration, index) => ({
    id: `demo_integration_${userId}_${index + 1}`,
    user_id: userId,
    organization_id: orgId,
    name: integration.name,
    type: integration.type,
    status: integration.status,
    category: integration.category,
    last_sync: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    data_points: 1000 + Math.floor(Math.random() * 5000),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Demo business health data
const generateDemoBusinessHealth = (userId, orgId) => {
  const overall = 65 + Math.floor(Math.random() * 30);
  
  return {
    id: `demo_health_${userId}`,
    user_id: userId,
    organization_id: orgId,
    overall_score: overall,
    sales_score: 60 + Math.floor(Math.random() * 35),
    marketing_score: 70 + Math.floor(Math.random() * 25),
    operations_score: 75 + Math.floor(Math.random() * 20),
    finance_score: 65 + Math.floor(Math.random() * 30),
    customer_satisfaction: 80 + Math.floor(Math.random() * 15),
    employee_satisfaction: 75 + Math.floor(Math.random() * 20),
    process_efficiency: 70 + Math.floor(Math.random() * 25),
    connected_sources: 6,
    completion_percentage: 75,
    data_quality_score: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Demo KPI data
const generateDemoKPIs = (userId, orgId) => {
  const kpis = [
    {
      name: 'Monthly Recurring Revenue',
      value: 45000 + Math.random() * 100000,
      target: 75000,
      unit: 'USD',
      trend: 'up',
      category: 'finance'
    },
    {
      name: 'Lead Conversion Rate',
      value: 12 + Math.random() * 8,
      target: 15,
      unit: '%',
      trend: 'up',
      category: 'sales'
    },
    {
      name: 'Customer Satisfaction',
      value: 85 + Math.random() * 10,
      target: 90,
      unit: '%',
      trend: 'stable',
      category: 'operations'
    },
    {
      name: 'Process Efficiency',
      value: 78 + Math.random() * 15,
      target: 85,
      unit: '%',
      trend: 'up',
      category: 'operations'
    },
    {
      name: 'Website Traffic',
      value: 15000 + Math.random() * 25000,
      target: 20000,
      unit: 'visitors',
      trend: 'up',
      category: 'marketing'
    },
    {
      name: 'Customer Lifetime Value',
      value: 2500 + Math.random() * 1500,
      target: 3000,
      unit: 'USD',
      trend: 'up',
      category: 'finance'
    }
  ];

  return kpis.map((kpi, index) => ({
    id: `demo_kpi_${userId}_${index + 1}`,
    user_id: userId,
    organization_id: orgId,
    name: kpi.name,
    value: Math.round(kpi.value),
    target: Math.round(kpi.target),
    unit: kpi.unit,
    trend: kpi.trend,
    category: kpi.category,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Demo activity data
const generateDemoActivities = (userId, orgId) => {
  const activities = [
    {
      type: 'sale',
      title: 'New Sale: Enterprise Package',
      description: 'Closed $25,000 enterprise deal with TechCorp Inc.',
      priority: 'high',
      status: 'completed'
    },
    {
      type: 'lead',
      title: 'New Lead: Marketing Director',
      description: 'Qualified lead from LinkedIn campaign',
      priority: 'medium',
      status: 'pending'
    },
    {
      type: 'task',
      title: 'Follow up with prospects',
      description: 'Call 5 qualified leads from last week',
      priority: 'medium',
      status: 'pending'
    },
    {
      type: 'integration',
      title: 'HubSpot sync completed',
      description: 'Successfully synced 150 new contacts',
      priority: 'low',
      status: 'completed'
    },
    {
      type: 'alert',
      title: 'High churn rate detected',
      description: 'Customer churn rate increased to 8.5%',
      priority: 'high',
      status: 'pending'
    }
  ];

  return activities.map((activity, index) => ({
    id: `demo_activity_${userId}_${index + 1}`,
    user_id: userId,
    organization_id: orgId,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    priority: activity.priority,
    status: activity.status,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Main seeding function
async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');

  try {
    // 1. Seed organizations
    console.log('📊 Seeding demo organizations...');
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert(demoOrganizations, { onConflict: 'id' });

    if (orgError) {
      console.error('❌ Error seeding organizations:', orgError);
      return;
    }
    console.log('✅ Demo organizations seeded');

    // 2. Seed users
    console.log('👥 Seeding demo users...');
    const { error: userError } = await supabase
      .from('users')
      .upsert(demoUsers, { onConflict: 'id' });

    if (userError) {
      console.error('❌ Error seeding users:', userError);
      return;
    }
    console.log('✅ Demo users seeded');

    // 3. Seed data for each demo user
    for (const user of demoUsers) {
      console.log(`📈 Seeding data for ${user.display_name}...`);

      // Financial data
      const financialData = generateDemoFinancialData(user.id, user.organization_id);
      const { error: financialError } = await supabase
        .from('financial_data')
        .upsert(financialData, { onConflict: 'id' });

      if (financialError) {
        console.error(`❌ Error seeding financial data for ${user.id}:`, financialError);
      } else {
        console.log(`✅ Financial data seeded for ${user.id}`);
      }

      // Integrations
      const integrations = generateDemoIntegrations(user.id, user.organization_id);
      const { error: integrationError } = await supabase
        .from('user_integrations')
        .upsert(integrations, { onConflict: 'id' });

      if (integrationError) {
        console.error(`❌ Error seeding integrations for ${user.id}:`, integrationError);
      } else {
        console.log(`✅ Integrations seeded for ${user.id}`);
      }

      // Business health
      const healthData = generateDemoBusinessHealth(user.id, user.organization_id);
      const { error: healthError } = await supabase
        .from('business_health_snapshots')
        .upsert(healthData, { onConflict: 'id' });

      if (healthError) {
        console.error(`❌ Error seeding business health for ${user.id}:`, healthError);
      } else {
        console.log(`✅ Business health seeded for ${user.id}`);
      }

      // KPIs
      const kpis = generateDemoKPIs(user.id, user.organization_id);
      const { error: kpiError } = await supabase
        .from('kpi_snapshots')
        .upsert(kpis, { onConflict: 'id' });

      if (kpiError) {
        console.error(`❌ Error seeding KPIs for ${user.id}:`, kpiError);
      } else {
        console.log(`✅ KPIs seeded for ${user.id}`);
      }

      // Activities
      const activities = generateDemoActivities(user.id, user.organization_id);
      const { error: activityError } = await supabase
        .from('user_activities')
        .upsert(activities, { onConflict: 'id' });

      if (activityError) {
        console.error(`❌ Error seeding activities for ${user.id}:`, activityError);
      } else {
        console.log(`✅ Activities seeded for ${user.id}`);
      }
    }

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Demo Accounts Created:');
    demoUsers.forEach(user => {
      console.log(`   • ${user.display_name} (${user.email})`);
    });
    console.log('\n🔑 Login with any of these demo accounts to see the seeded data.');

  } catch (error) {
    console.error('❌ Error during demo data seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };
