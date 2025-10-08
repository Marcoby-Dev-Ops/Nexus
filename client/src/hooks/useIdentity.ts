import { useEffect, useCallback } from 'react'
import { useIdentityStore } from '@/stores/useIdentityStore'
import { identityToDbData, dbDataToIdentity, calculateCompleteness, getNextAction, getSectionStatus } from '@/lib/identity/utils'
import type { IdentitySection, BusinessIdentity } from '@/lib/identity/types'
import { useCompany } from '@/shared/contexts/CompanyContext'
import { selectOne, insertOne, updateOne } from '@/lib/api-client'

/**
 * Custom hook for business identity management
 * Manages company branding, mission, values, and strategic context
 * Replaces the IdentityManager class with a simple, reactive hook
 */
export function useIdentity() {
  const { company, refreshCompany } = useCompany()
  const { identity, isLoading, setIdentity, updateSection, setLoading, setLastSaved } = useIdentityStore()

  // Load identity from database
  const loadIdentity = useCallback(async () => {
    // If the company is not yet linked to an identity, fallback to any locally cached state
    if (!company?.identity_id) {
      const stored = localStorage.getItem('nexus-business-identity')
      if (stored) {
        const parsed = JSON.parse(stored)
        setIdentity(calculateCompleteness(parsed))
      }
      return
    }

    setLoading(true)
    try {
      const result = await selectOne<any>('identities', { id: company.identity_id })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Identity record not found')
      }

      const identityData = dbDataToIdentity(result.data)
      const withCompleteness = calculateCompleteness(identityData)
      setIdentity(withCompleteness)

      // Backup to localStorage for offline resilience
      localStorage.setItem('nexus-business-identity', JSON.stringify(withCompleteness))
    } catch (error) {
      console.error('Failed to load identity:', error)
      const stored = localStorage.getItem('nexus-business-identity')
      if (stored) {
        const parsed = JSON.parse(stored)
        setIdentity(calculateCompleteness(parsed))
      }
    } finally {
      setLoading(false)
    }
  }, [company?.identity_id, setIdentity, setLoading])

  // Save identity to database
  const saveIdentity = useCallback(async (): Promise<boolean> => {
    const identityToSave = useIdentityStore.getState().identity

    if (!identityToSave) return false

    // The foundation name is required for database persistence
    if (!identityToSave.foundation.name?.trim()) {
      console.warn('Attempted to save identity without a company name')
      return false
    }

    setLoading(true)
    try {
      const dbData = identityToDbData(identityToSave)
      let savedRecord: any = null

      if (company?.identity_id) {
        const updateResult = await updateOne<any>('identities', company.identity_id, dbData)
        if (!updateResult.success || !updateResult.data) {
          throw new Error(updateResult.error || 'Failed to update identity')
        }
        savedRecord = updateResult.data
      } else {
        const createResult = await insertOne<any>('identities', dbData)
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error || 'Failed to create identity')
        }

        savedRecord = createResult.data
        const newIdentityId = createResult.data.id

        if (newIdentityId && company?.id) {
          const linkResult = await updateOne('companies', company.id, { identity_id: newIdentityId })
          if (!linkResult.success) {
            throw new Error(linkResult.error || 'Failed to link identity to company')
          }

          if (typeof refreshCompany === 'function') {
            await refreshCompany(true)
          }
        }
      }

      if (savedRecord) {
        const identityId = savedRecord.id || company?.identity_id

        let sourceRecord = savedRecord
        if (identityId) {
          const refreshed = await selectOne<any>('identities', { id: identityId })
          if (refreshed.success && refreshed.data) {
            sourceRecord = refreshed.data
          }
        }

        const normalized = calculateCompleteness(dbDataToIdentity(sourceRecord))
        setIdentity(normalized)
        localStorage.setItem('nexus-business-identity', JSON.stringify(normalized))
      }

      const now = new Date().toISOString()
      setLastSaved(now)
      return true
    } catch (error) {
      console.error('Failed to save identity:', error)
      // Preserve latest client state even if the network call fails
      localStorage.setItem('nexus-business-identity', JSON.stringify(identityToSave))
      return false
    } finally {
      setLoading(false)
    }
  }, [company, setLoading, setLastSaved, setIdentity, refreshCompany])

  // Update a section and recalculate completeness
  const updateIdentitySection = useCallback((section: IdentitySection, data: any) => {
    updateSection(section, data)
  }, [updateSection])

  // Export identity as JSON
  const exportIdentity = useCallback(() => {
    if (!identity) return null
    return JSON.stringify(identity, null, 2)
  }, [identity])

  // Import identity from JSON
  const importIdentity = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData)
      const withCompleteness = calculateCompleteness(parsed)
      setIdentity(withCompleteness)
      return true
    } catch (error) {
      console.error('Failed to import identity:', error)
      return false
    }
  }, [setIdentity])

  // Load identity when company changes
  useEffect(() => {
    if (company?.identity_id) {
      loadIdentity()
    }
  }, [company?.identity_id]) // Only re-run when identity_id changes

  // Computed values
  const nextAction = identity ? getNextAction(identity) : null
  const sectionStatus = useCallback((section: IdentitySection) => {
    if (!identity) return 'Not Started'
    return getSectionStatus(identity.completeness.sections[section] || 0)
  }, [identity])

  return {
    identity,
    isLoading,
    loadIdentity,
    saveIdentity,
    updateSection: updateIdentitySection,
    exportIdentity,
    importIdentity,
    nextAction,
    sectionStatus
  }
}
