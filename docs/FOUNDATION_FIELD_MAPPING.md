# Foundation Fields Mapping

## CompanyFoundation Interface → Identities Table

| TypeScript Field | Database Column | Status | Notes |
|-----------------|-----------------|--------|-------|
| `name` | `name` | ✅ | VARCHAR(255) NOT NULL |
| `legalName` | `legal_name` | ✅ | VARCHAR(255) |
| `legalStructure` | `legal_structure` | ⚠️ | **Mismatch**: TypeScript has 'Corporation', DB has 'C-Corp', 'S-Corp' |
| `foundedDate` | `founded_date` | ✅ | DATE |
| `headquarters.address` | `address.address` | ✅ | JSONB |
| `headquarters.city` | `address.city` | ✅ | JSONB |
| `headquarters.state` | `address.state` | ✅ | JSONB |
| `headquarters.country` | `address.country` | ✅ | JSONB |
| `headquarters.zipCode` | `address.zipCode` | ✅ | JSONB |
| `industry` | `industry` | ✅ | VARCHAR(100) |
| `sector` | `sector` | ✅ | VARCHAR(100) |
| `businessModel` | `business_model` | ⚠️ | **Missing options**: 'E-commerce', 'Consulting' |
| `companyStage` | `company_stage` | ⚠️ | **Missing option**: 'Idea' |
| `companySize` | `company_size` | ✅ | VARCHAR(50) |
| `website` | `website` | ✅ | VARCHAR(255) |
| `email` | `contact_info.email` | ✅ | JSONB |
| `phone` | `contact_info.phone` | ✅ | JSONB |
| `socialMedia.linkedin` | `contact_info.socialMedia.linkedin` | ✅ | JSONB |
| `socialMedia.twitter` | `contact_info.socialMedia.twitter` | ✅ | JSONB |
| `socialMedia.facebook` | `contact_info.socialMedia.facebook` | ✅ | JSONB |
| `socialMedia.instagram` | `contact_info.socialMedia.instagram` | ✅ | JSONB |
| `socialMedia.youtube` | `contact_info.socialMedia.youtube` | ✅ | JSONB |
| *(implicit)* | `description` | ✅ | TEXT - Added in DB but not in TypeScript interface |

## Issues to Fix

### 1. Legal Structure Mismatch
**TypeScript**: `'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship' | 'Other'`  
**Database**: `'LLC', 'C-Corp', 'S-Corp', 'Partnership', 'Sole Proprietorship', 'Non-Profit', 'Other'`

**Recommendation**: Update TypeScript to match DB:
```typescript
legalStructure: 'LLC' | 'C-Corp' | 'S-Corp' | 'Partnership' | 'Sole Proprietorship' | 'Non-Profit' | 'Other'
```

### 2. Business Model Missing Options
**TypeScript**: `'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'SaaS' | 'E-commerce' | 'Consulting' | 'Other'`  
**Database**: `'B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Other'`

**Recommendation**: Add to database CHECK constraint:
```sql
CHECK (business_model IN ('B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'E-commerce', 'Consulting', 'Other'))
```

### 3. Company Stage Missing 'Idea'
**TypeScript**: `'Idea' | 'Startup' | 'Growth' | 'Mature' | 'Enterprise'`  
**Database**: `'Startup', 'Growth', 'Mature', 'Enterprise'`

**Recommendation**: Add to database CHECK constraint:
```sql
CHECK (company_stage IN ('Idea', 'Startup', 'Growth', 'Mature', 'Enterprise'))
```

### 4. Description Field Missing from TypeScript
**Database** has `description TEXT` but TypeScript CompanyFoundation doesn't have this field.

**Recommendation**: Add to TypeScript interface:
```typescript
description?: string
```

## Summary

✅ **All core fields are present**  
⚠️ **3 enum mismatches need to be fixed**  
⚠️ **1 field (description) missing from TypeScript**


