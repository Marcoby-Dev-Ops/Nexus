describe('Progressive Intelligence E2E', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.intercept('POST', '/api/**', { statusCode: 200, body: { success: true } }).as('apiCall');
  });

  it('should display and execute AI actions', () => {
    // Navigate to AI section
    cy.get('[data-testid="ai-assistant"]').click();
    
    // Wait for progressive intelligence to load
    cy.get('[data-testid="progressive-intelligence"]').should('be.visible');
    
    // Check if actions are displayed
    cy.get('[data-testid="ai-action-card"]').should('have.length.greaterThan', 0);
    
    // Execute first action
    cy.get('[data-testid="execute-action"]').first().click();
    
    // Verify loading state
    cy.get('[data-testid="action-status"]').should('contain', 'Executing');
    
    // Wait for completion
    cy.wait('@apiCall');
    cy.get('[data-testid="action-status"]').should('contain', 'Completed');
  });

  it('should handle action execution errors gracefully', () => {
    cy.intercept('POST', '/api/**', { statusCode: 500, body: { error: 'Server error' } }).as('apiError');
    
    cy.visit('/dashboard');
    cy.get('[data-testid="ai-assistant"]').click();
    cy.get('[data-testid="execute-action"]').first().click();
    
    cy.wait('@apiError');
    cy.get('[data-testid="action-status"]').should('contain', 'Failed');
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should track action execution events', () => {
    cy.intercept('POST', '/api/analytics/events', { statusCode: 200 }).as('trackEvent');
    
    cy.visit('/dashboard');
    cy.get('[data-testid="ai-assistant"]').click();
    cy.get('[data-testid="execute-action"]').first().click();
    
    cy.wait('@trackEvent');
    cy.get('@trackEvent').should('have.been.called');
  });
}); 