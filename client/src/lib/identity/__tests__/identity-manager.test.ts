// Simple test to verify Identity Manager functionality
import { IdentityManager } from '../identity-manager'

describe('IdentityManager', () => {
  let identityManager: IdentityManager

  beforeEach(() => {
    identityManager = new IdentityManager()
  })

  test('should initialize with default identity', () => {
    const identity = identityManager.getIdentity()
    expect(identity).toBeDefined()
    expect(identity.foundation.name).toBe('')
    expect(identity.completeness.overall).toBe(0)
  })

  test('should calculate completion correctly', () => {
    const identity = identityManager.getIdentity()
    expect(identity.completeness.overall).toBe(0)
    
    // Update foundation with basic info
    identityManager.updateSection('foundation', {
      name: 'Test Company',
      industry: 'Technology',
      businessModel: 'B2B',
      website: 'https://test.com',
      email: 'test@test.com'
    })
    
    const updatedIdentity = identityManager.getIdentity()
    expect(updatedIdentity.completeness.overall).toBeGreaterThan(0)
  })

  test('should get next action recommendation', () => {
    const nextAction = identityManager.getNextAction()
    expect(nextAction).toBeDefined()
    expect(nextAction.section).toBe('foundation')
    expect(nextAction.priority).toBe('High')
  })

  test('should save and load from storage', () => {
    identityManager.updateSection('foundation', {
      name: 'Test Company'
    })
    
    identityManager.saveToStorage()
    const newManager = new IdentityManager()
    const loaded = newManager.loadFromStorage()
    
    expect(loaded).toBe(true)
    expect(newManager.getIdentity().foundation.name).toBe('Test Company')
  })
})
