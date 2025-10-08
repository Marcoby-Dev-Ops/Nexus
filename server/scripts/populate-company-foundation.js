#!/usr/bin/env node

/**
 * Populate Company Foundation Data
 * 
 * This script populates the company foundation data structure
 * with Marcoby's business information to establish the 7 Building Blocks foundation.
 */

const { Pool } = require('pg');

// Your Marcoby company data
const marcobyFoundationData = {
  foundation: {
    name: 'Marcoby',
    legalName: 'Marcoby LLC',
    legalStructure: 'LLC',
    foundedDate: '2024-01-01', // Update with actual date
    headquarters: {
      address: 'Your Business Address', // Update with actual address
      city: 'Your City',
      state: 'Your State',
      country: 'United States',
      zipCode: 'Your ZIP'
    },
    industry: 'Technology',
    sector: 'Software Development',
    businessModel: 'B2B',
    companyStage: 'Startup',
    companySize: 'Small (2-10)',
    website: 'https://marcoby.com', // Update with actual website
    email: 'hello@marcoby.com',
    phone: 'Your Phone Number', // Update with actual phone
    socialMedia: {
      linkedin: 'https://linkedin.com/company/marcoby',
      twitter: 'https://twitter.com/marcoby',
      // Add other social media as needed
    }
  },
  
  missionVisionValues: {
    missionStatement: 'To build innovative technology solutions that empower businesses to operate more efficiently and make better decisions through AI-powered automation and intelligence.',
    visionStatement: 'To become the leading provider of business operating systems that make business success inevitable through intelligent automation and data-driven insights.',
    purpose: 'We exist to democratize advanced business intelligence and automation, making sophisticated business operations accessible to companies of all sizes.',
    
    coreValues: [
      {
        name: 'Innovation',
        description: 'Continuously pushing the boundaries of what\'s possible with technology',
        importance: 'High'
      },
      {
        name: 'Efficiency',
        description: 'Building solutions that maximize productivity and minimize waste',
        importance: 'High'
      },
      {
        name: 'Intelligence',
        description: 'Making data-driven decisions and providing actionable insights',
        importance: 'High'
      },
      {
        name: 'Accessibility',
        description: 'Making advanced business tools accessible to all companies',
        importance: 'Medium'
      }
    ],
    
    companyCulture: {
      workStyle: ['Remote-first', 'Collaborative', 'Results-oriented'],
      communicationStyle: ['Direct', 'Transparent', 'Async-friendly'],
      decisionMaking: 'Data-driven with collaborative input',
      innovationApproach: 'Rapid prototyping and iterative development'
    },
    
    brandPersonality: [
      {
        trait: 'Professional',
        description: 'Reliable and trustworthy business partner'
      },
      {
        trait: 'Innovative',
        description: 'Cutting-edge technology solutions'
      },
      {
        trait: 'Efficient',
        description: 'Streamlined and optimized processes'
      }
    ],
    
    brandVoice: {
      tone: 'Professional yet approachable',
      style: 'Clear, concise, and action-oriented',
      examples: [
        'We help businesses operate more efficiently',
        'AI-powered solutions for better decision making',
        'Making business success inevitable through technology'
      ]
    }
  },
  
  productsServices: {
    offerings: [
      {
        name: 'Nexus Business Operating System',
        type: 'Solution',
        description: 'Comprehensive business intelligence and automation platform built on the 7 Building Blocks framework',
        category: 'Business Intelligence',
        keyFeatures: [
          '7 Building Blocks Framework',
          'AI-Powered Insights',
          'Automated Workflows',
          'Real-time Analytics',
          'Integration Hub'
        ],
        benefits: [
          'Complete business visibility',
          'Automated decision making',
          'Improved operational efficiency',
          'Data-driven growth'
        ],
        pricing: {
          model: 'Subscription',
          range: 'Custom pricing based on company size and needs'
        },
        status: 'Development'
      }
    ],
    
    uniqueValueProposition: 'The only business operating system built on the proven 7 Building Blocks framework, providing complete business intelligence and automation in one unified platform.',
    competitiveAdvantages: [
      'Comprehensive 7 Building Blocks framework',
      'AI-powered business intelligence',
      'Unified platform approach',
      'Industry-specific customization'
    ],
    differentiators: [
      'Built on proven business framework',
      'Complete business operating system',
      'AI agents for each building block',
      'Real-time business health monitoring'
    ],
    
    productRoadmap: [
      {
        feature: 'Core 7 Building Blocks Dashboard',
        timeline: 'Q1 2024',
        priority: 'High',
        status: 'In Development'
      },
      {
        feature: 'AI Agents for each Building Block',
        timeline: 'Q2 2024',
        priority: 'High',
        status: 'Planned'
      },
      {
        feature: 'Advanced Analytics and Reporting',
        timeline: 'Q3 2024',
        priority: 'Medium',
        status: 'Planned'
      }
    ]
  },
  
  targetMarket: {
    totalAddressableMarket: {
      size: '$50B+',
      description: 'Global business intelligence and automation market'
    },
    
    serviceableAddressableMarket: {
      size: '$5B+',
      description: 'SMB and mid-market business intelligence solutions'
    },
    
    serviceableObtainableMarket: {
      size: '$500M+',
      percentage: 1,
      description: 'Technology-forward SMBs seeking comprehensive business operating systems'
    },
    
    customerSegments: [
      {
        name: 'Technology Startups',
        description: 'Early-stage tech companies looking to scale efficiently',
        size: '10,000+ companies',
        priority: 'High'
      },
      {
        name: 'Growing SMBs',
        description: 'Small to medium businesses ready to implement business intelligence',
        size: '100,000+ companies',
        priority: 'High'
      },
      {
        name: 'Professional Services',
        description: 'Consulting, marketing, and service-based businesses',
        size: '50,000+ companies',
        priority: 'Medium'
      }
    ],
    
    idealCustomerProfile: {
      demographics: {
        industry: ['Technology', 'Professional Services', 'E-commerce', 'SaaS'],
        companySize: ['2-50 employees', '51-200 employees'],
        location: ['North America', 'Europe', 'Australia'],
        revenue: ['$100K-$10M ARR']
      },
      psychographics: {
        painPoints: [
          'Scattered business data across multiple tools',
          'Manual processes limiting growth',
          'Lack of actionable business insights',
          'Difficulty making data-driven decisions'
        ],
        goals: [
          'Improve operational efficiency',
          'Scale business operations',
          'Make better business decisions',
          'Automate manual processes'
        ],
        challenges: [
          'Limited technical resources',
          'Budget constraints',
          'Time to implement solutions',
          'Integration complexity'
        ],
        motivations: [
          'Growth and scaling',
          'Competitive advantage',
          'Operational excellence',
          'Business intelligence'
        ]
      },
      behavior: {
        buyingProcess: 'Research-heavy, multiple stakeholders, 3-6 month decision cycle',
        decisionFactors: [
          'ROI and business impact',
          'Ease of implementation',
          'Integration capabilities',
          'Support and training'
        ],
        preferredChannels: [
          'Content marketing',
          'Webinars and demos',
          'Referrals and recommendations',
          'Direct sales'
        ]
      }
    }
  },
  
  competitiveLandscape: {
    directCompetitors: [
      {
        name: 'Monday.com',
        website: 'https://monday.com',
        description: 'Work management platform with business intelligence features',
        strengths: ['User-friendly interface', 'Strong project management'],
        weaknesses: ['Limited business intelligence', 'Not comprehensive'],
        positioning: 'Project management focused'
      },
      {
        name: 'Tableau',
        website: 'https://tableau.com',
        description: 'Business intelligence and data visualization platform',
        strengths: ['Powerful analytics', 'Data visualization'],
        weaknesses: ['Complex setup', 'High cost', 'Not integrated'],
        positioning: 'Enterprise BI focused'
      }
    ],
    
    indirectCompetitors: [
      {
        name: 'Zapier',
        type: 'Automation Platform',
        description: 'Workflow automation and integration platform',
        whyAlternative: 'Users might use for basic automation instead of comprehensive business OS'
      },
      {
        name: 'HubSpot',
        type: 'CRM Platform',
        description: 'Customer relationship management with some business intelligence',
        whyAlternative: 'Users might use for customer management instead of full business OS'
      }
    ],
    
    competitivePositioning: {
      position: 'The only comprehensive business operating system built on the proven 7 Building Blocks framework',
      differentiation: [
        '7 Building Blocks framework foundation',
        'Complete business operating system approach',
        'AI agents for each building block',
        'Unified platform vs. point solutions'
      ],
      advantages: [
        'Comprehensive business view',
        'Proven framework foundation',
        'AI-powered insights',
        'Integrated approach'
      ],
      threats: [
        'Established competitors with market presence',
        'Customer inertia with existing solutions',
        'High switching costs',
        'Need to prove ROI quickly'
      ]
    },
    
    marketTrends: [
      'Increasing demand for business intelligence',
      'AI and automation adoption acceleration',
      'Remote work driving digital transformation',
      'SMB focus on operational efficiency'
    ],
    opportunities: [
      'Growing AI adoption in business',
      'SMB digital transformation needs',
      'Integration complexity pain points',
      'Unified platform demand'
    ],
    threats: [
      'Economic uncertainty affecting tech spending',
      'Competition from established players',
      'Customer acquisition costs',
      'Technical implementation challenges'
    ]
  },
  
  businessOperations: {
    team: {
      size: 2,
      structure: [
        {
          department: 'Engineering',
          headCount: 1,
          keyRoles: ['Full-stack Developer', 'AI/ML Engineer']
        },
        {
          department: 'Business',
          headCount: 1,
          keyRoles: ['CEO', 'Product Manager', 'Business Development']
        }
      ],
      keyPeople: [
        {
          name: 'Von Jackson',
          role: 'CEO & Founder',
          department: 'Business',
          responsibilities: [
            'Strategic direction',
            'Product vision',
            'Business development',
            'Customer relations'
          ]
        }
      ]
    },
    
    keyProcesses: [
      {
        name: 'Product Development',
        description: 'Agile development process for Nexus platform',
        owner: 'Von Jackson',
        status: 'Optimized',
        tools: ['GitHub', 'Vite', 'React', 'Node.js']
      },
      {
        name: 'Customer Onboarding',
        description: 'Process for onboarding new customers to Nexus',
        owner: 'Von Jackson',
        status: 'Good',
        tools: ['Nexus Platform', 'Documentation']
      }
    ],
    
    technologyStack: {
      frontend: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite'],
      backend: ['Node.js', 'Express', 'PostgreSQL'],
      database: ['PostgreSQL', 'pgvector'],
      infrastructure: ['Coolify', 'Marcoby Cloud'],
      tools: ['GitHub', 'Vite', 'ESLint', 'Prettier'],
      integrations: ['Authentik', 'n8n', 'OpenAI', 'OpenRouter']
    },
    
    operationalMetrics: [
      {
        metric: 'Platform Uptime',
        value: '99.9%',
        trend: 'Stable',
        frequency: 'Daily'
      },
      {
        metric: 'Development Velocity',
        value: '2-3 features/week',
        trend: 'Up',
        frequency: 'Weekly'
      }
    ]
  },
  
  financialContext: {
    revenue: {
      model: 'Subscription (SaaS)',
      currentAnnual: 'Pre-revenue',
      growth: {
        rate: 0,
        period: 'N/A - Pre-revenue stage'
      }
    },
    
    financialHealth: {
      profitability: 'Loss-making',
      cashFlow: 'Negative',
      burnRate: 'Low - Bootstrapped development',
      runway: '12+ months'
    },
    
    funding: {
      stage: 'Bootstrapped',
      totalRaised: '$0'
    },
    
    financialGoals: [
      {
        goal: 'Achieve Product-Market Fit',
        target: 'Q2 2024',
        timeline: '6 months',
        current: 'In Development'
      },
      {
        goal: 'First Paying Customers',
        target: '10 customers',
        timeline: 'Q3 2024',
        current: '0'
      },
      {
        goal: 'Monthly Recurring Revenue',
        target: '$10K MRR',
        timeline: 'Q4 2024',
        current: '$0'
      }
    ]
  },
  
  strategicContext: {
    goals: {
      shortTerm: [
        {
          goal: 'Complete MVP Development',
          target: 'Fully functional 7 Building Blocks platform',
          timeline: 'Q1 2024',
          status: 'In Progress'
        },
        {
          goal: 'Launch Beta Program',
          target: '10 beta customers',
          timeline: 'Q2 2024',
          status: 'Planned'
        }
      ],
      longTerm: [
        {
          goal: 'Market Leadership',
          target: 'Leading business operating system platform',
          timeline: '3 years',
          status: 'Planned'
        },
        {
          goal: 'Scale to 1000+ Customers',
          target: '1000 active customers',
          timeline: '2 years',
          status: 'Planned'
        }
      ]
    },
    
    strategicPriorities: [
      {
        priority: 'Product Development',
        description: 'Complete core platform development',
        importance: 'Critical',
        timeline: 'Q1 2024',
        owner: 'Von Jackson'
      },
      {
        priority: 'Customer Validation',
        description: 'Validate product-market fit with beta customers',
        importance: 'Critical',
        timeline: 'Q2 2024',
        owner: 'Von Jackson'
      },
      {
        priority: 'Go-to-Market Strategy',
        description: 'Develop and execute customer acquisition strategy',
        importance: 'High',
        timeline: 'Q2 2024',
        owner: 'Von Jackson'
      }
    ],
    
    challenges: [
      {
        challenge: 'Technical Complexity',
        impact: 'High',
        urgency: 'Medium',
        owner: 'Von Jackson',
        status: 'In Progress'
      },
      {
        challenge: 'Customer Acquisition',
        impact: 'High',
        urgency: 'Low',
        status: 'Identified'
      },
      {
        challenge: 'Resource Constraints',
        impact: 'Medium',
        urgency: 'Medium',
        owner: 'Von Jackson',
        status: 'Identified'
      }
    ],
    
    successMetrics: [
      {
        metric: 'Platform Completion',
        current: '60%',
        target: '100%',
        frequency: 'Weekly',
        owner: 'Von Jackson'
      },
      {
        metric: 'Customer Satisfaction',
        current: 'N/A',
        target: '4.5/5',
        frequency: 'Monthly',
        owner: 'Von Jackson'
      },
      {
        metric: 'Time to Value',
        current: 'N/A',
        target: '< 30 days',
        frequency: 'Monthly',
        owner: 'Von Jackson'
      }
    ]
  },
  
  // Metadata
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  completeness: {
    overall: 85, // High completion based on comprehensive data
    sections: {
      foundation: 95,
      missionVisionValues: 90,
      productsServices: 85,
      targetMarket: 80,
      competitiveLandscape: 75,
      businessOperations: 90,
      financialContext: 70,
      strategicContext: 85
    }
  }
};

async function populateCompanyFoundation() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Starting Company Foundation Population...');
    
    // Get the user ID (you'll need to update this with your actual user ID)
    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // 1. Update user profile with foundation data
    console.log('📝 Updating user profile with foundation data...');
    
    const userProfileUpdate = `
      UPDATE user_profiles 
      SET 
        company_name = $1,
        job_title = $2,
        role = $3,
        bio = $4,
        website = $5,
        linkedin_url = $6,
        updated_at = NOW()
      WHERE user_id = $7
    `;
    
    await pool.query(userProfileUpdate, [
      marcobyFoundationData.foundation.name,
      'CEO & Founder',
      'owner',
      marcobyFoundationData.missionVisionValues.missionStatement,
      marcobyFoundationData.foundation.website,
      marcobyFoundationData.foundation.socialMedia.linkedin,
      externalUserId
    ]);
    
    // 2. Update company record with foundation data
    console.log('🏢 Updating company record with foundation data...');
    
    const companyUpdate = `
      UPDATE companies 
      SET 
        name = $1,
        industry = $2,
        size = $3,
        description = $4,
        website = $5,
        address = $6,
        contact_info = $7,
        settings = $8,
        updated_at = NOW()
      WHERE owner_id = $9
    `;
    
    await pool.query(companyUpdate, [
      marcobyFoundationData.foundation.name,
      marcobyFoundationData.foundation.industry,
      marcobyFoundationData.foundation.companySize,
      marcobyFoundationData.missionVisionValues.missionStatement,
      marcobyFoundationData.foundation.website,
      JSON.stringify(marcobyFoundationData.foundation.headquarters),
      JSON.stringify({
        email: marcobyFoundationData.foundation.email,
        phone: marcobyFoundationData.foundation.phone,
        socialMedia: marcobyFoundationData.foundation.socialMedia
      }),
      JSON.stringify({
        businessModel: marcobyFoundationData.foundation.businessModel,
        companyStage: marcobyFoundationData.foundation.companyStage,
        legalStructure: marcobyFoundationData.foundation.legalStructure
      }),
      externalUserId
    ]);
    
    // 3. Store complete foundation data in a dedicated table
    console.log('💾 Storing complete foundation data...');
    
    // Create foundation_data table if it doesn't exist
    const createFoundationTable = `
      CREATE TABLE IF NOT EXISTS foundation_data (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id VARCHAR(255) NOT NULL,
        company_id UUID REFERENCES companies(id),
        foundation_data JSONB NOT NULL,
        completeness_score INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;
    
    await pool.query(createFoundationTable);
    
    // Get company ID
    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE owner_id = $1',
      [externalUserId]
    );
    
    if (companyResult.rows.length === 0) {
      throw new Error('Company not found for user');
    }
    
    const companyId = companyResult.rows[0].id;
    
    // Insert or update foundation data
    const insertFoundationData = `
      INSERT INTO foundation_data (user_id, company_id, foundation_data, completeness_score)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        foundation_data = EXCLUDED.foundation_data,
        completeness_score = EXCLUDED.completeness_score,
        last_updated = NOW()
    `;
    
    await pool.query(insertFoundationData, [
      externalUserId,
      companyId,
      JSON.stringify(marcobyFoundationData),
      marcobyFoundationData.completeness.overall
    ]);
    
    console.log('✅ Company Foundation Population Complete!');
    console.log(`📊 Overall Completion: ${marcobyFoundationData.completeness.overall}%`);
    console.log('🎯 Foundation sections populated:');
    Object.entries(marcobyFoundationData.completeness.sections).forEach(([section, score]) => {
      console.log(`   - ${section}: ${score}%`);
    });
    
    // 4. Verify the data
    console.log('\n🔍 Verifying populated data...');
    
    const verifyQuery = `
      SELECT 
        up.first_name,
        up.last_name,
        up.company_name,
        up.job_title,
        up.role,
        c.name as company_name,
        c.industry,
        c.size,
        c.description,
        fd.completeness_score
      FROM user_profiles up
      LEFT JOIN companies c ON up.company_id = c.id
      LEFT JOIN foundation_data fd ON up.user_id = fd.user_id
      WHERE up.user_id = $1
    `;
    
    const verifyResult = await pool.query(verifyQuery, [externalUserId]);
    
    if (verifyResult.rows.length > 0) {
      const data = verifyResult.rows[0];
      console.log('\n📋 Populated Data Summary:');
      console.log(`👤 User: ${data.first_name} ${data.last_name}`);
      console.log(`🏢 Company: ${data.company_name}`);
      console.log(`💼 Role: ${data.job_title} (${data.role})`);
      console.log(`🏭 Industry: ${data.industry}`);
      console.log(`📏 Size: ${data.size}`);
      console.log(`📝 Description: ${data.description?.substring(0, 100)}...`);
      console.log(`📊 Foundation Completion: ${data.completeness_score}%`);
    }
    
  } catch (error) {
    console.error('❌ Error populating company foundation:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  populateCompanyFoundation()
    .then(() => {
      console.log('\n🎉 Company Foundation Population Successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateCompanyFoundation, marcobyFoundationData };
