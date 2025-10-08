#!/usr/bin/env node
/*
 Normalize industry migration
 - Scans companies table and business_identity JSONB
 - Normalizes industry values to a canonical set
 - Supports --dry-run (default) and --apply to commit changes

 Usage:
  DATABASE_URL=postgres://... node server/scripts/normalize-industry.js --dry-run
  DATABASE_URL=postgres://... node server/scripts/normalize-industry.js --apply
*/

const { Client } = require('pg')
const assert = require('assert')

const NAICS_TO_INDUSTRY = {
  '11': 'Agriculture & Food',
  '21': 'Energy & Utilities',
  '22': 'Energy & Utilities',
  '23': 'Real Estate & Construction',
  '31-33': 'Manufacturing',
  '42': 'Wholesale & Distribution',
  '44-45': 'Retail & Ecommerce',
  '48-49': 'Transportation & Logistics',
  '51': 'Media & Entertainment',
  '52': 'Financial Services',
  '53': 'Real Estate & Construction',
  '54': 'Professional Services',
  '55': 'Professional Services',
  '56': 'Professional Services',
  '61': 'Education & EdTech',
  '62': 'Healthcare & Life Sciences',
  '71': 'Media & Entertainment',
  '72': 'Hospitality & Travel',
  '81': 'Nonprofit & Social Impact',
  '92': 'Government & Public Sector'
}

const INDUSTRY_OPTIONS = [
  'Technology & Software',
  'Professional Services',
  'Healthcare & Life Sciences',
  'Financial Services',
  'Retail & Ecommerce',
  'Manufacturing',
  'Media & Entertainment',
  'Education & EdTech',
  'Government & Public Sector',
  'Nonprofit & Social Impact',
  'Real Estate & Construction',
  'Energy & Utilities',
  'Transportation & Logistics',
  'Wholesale & Distribution',
  'Hospitality & Travel',
  'Consumer Goods & CPG',
  'Agriculture & Food',
  'Automotive & Mobility',
  'Telecommunications',
  'Marketing & Advertising',
  'Other / Emerging'
]

function getIndustryValue(value) {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''

  if (INDUSTRY_OPTIONS.includes(trimmed)) return trimmed
  return NAICS_TO_INDUSTRY[trimmed] || trimmed
}

function usageAndExit() {
  console.log('Usage: DATABASE_URL=... node server/scripts/normalize-industry.js [--dry-run|--apply]')
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dryRun = !apply

  const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING
  if (!connectionString) {
    console.error('Please set DATABASE_URL environment variable pointing to the Postgres database')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    // Fetch companies with non-empty industry or business_identity containing industry
    const res = await client.query(`
      SELECT id, industry, business_identity
      FROM companies
      WHERE (industry IS NOT NULL AND industry <> '')
         OR (business_identity IS NOT NULL)
    `)

    console.log(`Found ${res.rows.length} companies to inspect`)

    let updates = []

    for (const row of res.rows) {
      const id = row.id
      const companyIndustryRaw = row.industry
      let businessIdentity = null
      try {
        businessIdentity = row.business_identity && typeof row.business_identity === 'object'
          ? row.business_identity
          : JSON.parse(row.business_identity || '{}')
      } catch (err) {
        businessIdentity = row.business_identity
      }

      const foundation = (businessIdentity && businessIdentity.foundation) || {}
      const identityIndustryRaw = foundation.industry || ''

      const canonicalCompanyIndustry = getIndustryValue(companyIndustryRaw)
      const canonicalIdentityIndustry = getIndustryValue(identityIndustryRaw)

      // Decide final industry priority: prefer identity if present, else company
      const finalCanonical = canonicalIdentityIndustry || canonicalCompanyIndustry

      if (!finalCanonical) continue // nothing to normalize

      // If current stored values differ from canonical, prepare update
      const companyNeedsUpdate = (companyIndustryRaw || '') !== finalCanonical
      const identityNeedsUpdate = (identityIndustryRaw || '') !== finalCanonical

      if (companyNeedsUpdate || identityNeedsUpdate) {
        updates.push({ id, companyIndustryRaw, identityIndustryRaw, finalCanonical, companyNeedsUpdate, identityNeedsUpdate })
      }
    }

    console.log(`Prepared ${updates.length} updates`)

    for (const u of updates) {
      console.log(`Company ${u.id}: company='${u.companyIndustryRaw}' identity='${u.identityIndustryRaw}' -> '${u.finalCanonical}'`)
    }

    if (!apply) {
      console.log('\nDry run complete. No changes were applied. Rerun with --apply to commit changes.')
      await client.end()
      process.exit(0)
    }

    console.log('\nApplying updates...')

    for (const u of updates) {
      const updatesObj = {}
      if (u.companyNeedsUpdate) {
        // Update top-level companies.industry
        await client.query('UPDATE companies SET industry = $1, updated_at = NOW() WHERE id = $2', [u.finalCanonical, u.id])
      }

      if (u.identityNeedsUpdate) {
        // Update JSONB business_identity.foundation.industry
        await client.query(
          `UPDATE companies
           SET business_identity = jsonb_set(coalesce(business_identity, '{}'::jsonb), '{foundation,industry}', to_jsonb($1::text), true), updated_at = NOW()
           WHERE id = $2`,
          [u.finalCanonical, u.id]
        )
      }
    }

    console.log('Updates applied successfully')
    await client.end()
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    await client.end()
    process.exit(2)
  }
}

main()
