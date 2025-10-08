# Nexus Data Architecture: Layered Approach

## Core Principle: Build Upon Itself, Present Differently

Instead of duplicating data across multiple tables/columns, we use a **layered architecture** where data builds upon itself and is presented through different lenses.

## Layer 1: Core Foundation (Single Source of Truth)

**Storage**: `companies.business_identity` (JSONB)

```json
{
  "foundation": {
    "name": "Marcoby",
    "legalName": "Marcoby LLC",
    "legalStructure": "LLC",
    "foundedDate": "2023-01-01",
    "headquarters": { "address": "123 Business St", "city": "San Francisco", "state": "CA", "country": "USA", "zipCode": "94105" },
    "industry": "Technology",
    "sector": "Business Automation",
    "businessModel": "B2B",
    "companyStage": "Startup",
    "companySize": "Small (2-10)",
    "website": "https://marcoby.com",
    "email": "hello@marcoby.com",
    "phone": "+1 (555) 123-4567",
    "description": "AI-powered business automation platform"
  },
  "missionVisionValues": {
    "missionStatement": "To empower businesses with intelligent automation",
    "visionStatement": "A world where every business operates at peak efficiency",
    "coreValues": ["Innovation", "Efficiency", "Customer Success"],
    "purpose": "Democratizing business optimization through AI"
  },
  "productsServices": {
    "offerings": [
      { "name": "Nexus Platform", "description": "Comprehensive business management system", "category": "Platform" },
      { "name": "AI Automation", "description": "Intelligent workflow automation", "category": "Service" }
    ],
    "uniqueValueProposition": "AI-first approach to business optimization"
  },
  "targetMarket": {
    "customerSegments": [
      { "name": "SMBs", "description": "Small to medium businesses", "size": "2-200 employees" },
      { "name": "Startups", "description": "Early-stage companies", "stage": "Idea to Series A" }
    ],
    "idealCustomerProfile": {
      "industry": ["Technology", "Professional Services", "E-commerce"],
      "painPoints": ["Manual processes", "Lack of automation", "Inefficient operations"]
    }
  }
}
```

## Layer 2: Presentation Views (Computed/Generated)

### View 1: Company Summary
```sql
SELECT 
  name,
  business_identity->'foundation'->>'industry' as industry,
  business_identity->'foundation'->>'businessModel' as business_model,
  business_identity->'foundation'->>'companyStage' as stage
FROM companies;
```

### View 2: Contact Information
```sql
SELECT 
  name,
  business_identity->'foundation'->>'email' as email,
  business_identity->'foundation'->>'phone' as phone,
  business_identity->'foundation'->>'website' as website
FROM companies;
```

### View 3: Mission & Values
```sql
SELECT 
  name,
  business_identity->'missionVisionValues'->>'missionStatement' as mission,
  business_identity->'missionVisionValues'->>'visionStatement' as vision,
  business_identity->'missionVisionValues'->'coreValues' as values
FROM companies;
```

## Layer 3: Focused Presentations (UI Components)

### Foundation Focus
- Company basics (name, industry, structure)
- Contact information
- Location details

### Mission Focus  
- Mission statement
- Vision statement
- Core values
- Company purpose

### Market Focus
- Target customers
- Competitive positioning
- Market opportunities

### Operations Focus
- Team structure
- Key processes
- Business model

### Strategic Focus
- Goals and objectives
- Strategic priorities
- Success metrics

## Benefits

1. **Single Source of Truth**: All data stored once in JSONB
2. **No Duplication**: Data builds upon itself, not copied
3. **Flexible Presentation**: Same data, different views/focuses
4. **Easy Updates**: Change once, reflects everywhere
5. **Scalable**: Add new focuses without schema changes
6. **Queryable**: JSONB indexes for performance
7. **Versioned**: Can track changes over time

## Implementation

### Database Level
- Use JSONB for flexible storage
- Create functional indexes for common queries
- Use views for standard presentations

### Application Level  
- IdentityManager reads from single source
- Different UI components present different focuses
- Shared data transforms for consistent presentation

### UI Level
- Foundation tab → Layer 1 + Foundation Focus
- Mission tab → Layer 1 + Mission Focus  
- Market tab → Layer 1 + Market Focus
- Operations tab → Layer 1 + Operations Focus
- Strategy tab → Layer 1 + Strategic Focus
