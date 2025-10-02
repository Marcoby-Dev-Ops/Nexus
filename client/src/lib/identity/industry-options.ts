export interface IndustryOption {
  value: string
  label: string
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'Technology & Software', label: 'Technology & Software' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Healthcare & Life Sciences', label: 'Healthcare & Life Sciences' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Retail & Ecommerce', label: 'Retail & Ecommerce' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Media & Entertainment', label: 'Media & Entertainment' },
  { value: 'Education & EdTech', label: 'Education & EdTech' },
  { value: 'Government & Public Sector', label: 'Government & Public Sector' },
  { value: 'Nonprofit & Social Impact', label: 'Nonprofit & Social Impact' },
  { value: 'Real Estate & Construction', label: 'Real Estate & Construction' },
  { value: 'Energy & Utilities', label: 'Energy & Utilities' },
  { value: 'Transportation & Logistics', label: 'Transportation & Logistics' },
  { value: 'Wholesale & Distribution', label: 'Wholesale & Distribution' },
  { value: 'Hospitality & Travel', label: 'Hospitality & Travel' },
  { value: 'Consumer Goods & CPG', label: 'Consumer Goods & CPG' },
  { value: 'Agriculture & Food', label: 'Agriculture & Food' },
  { value: 'Automotive & Mobility', label: 'Automotive & Mobility' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Marketing & Advertising', label: 'Marketing & Advertising' },
  { value: 'Other / Emerging', label: 'Other / Emerging' }
]

const NAICS_TO_INDUSTRY: Record<string, string> = {
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

export const getIndustryValue = (value: string | null | undefined): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (INDUSTRY_OPTIONS.some((option) => option.value === trimmed)) {
    return trimmed
  }

  return NAICS_TO_INDUSTRY[trimmed] || trimmed
}

export const getIndustryLabel = (value: string | null | undefined): string => {
  const normalized = getIndustryValue(value)
  if (!normalized) return ''
  const match = INDUSTRY_OPTIONS.find((option) => option.value === normalized)
  return match ? match.label : normalized
}
