describe('Slash Command Autocomplete', () => {
  beforeEach(() => {
    // Mock successful authentication
    cy.visit('/auth/login');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard/chat
    cy.url().should('include', '/');
    
    // Navigate to chat if not already there
    cy.get('textarea[placeholder*="Type your message"]').should('be.visible');
  });

  it('should show slash command menu when typing "/" ', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Type a slash to trigger the menu
    textarea.type('/');
    
    // Menu should appear
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[aria-label="Slash command suggestions"]').should('exist');
    
    // Should show loading state initially
    cy.contains('Loading commands...').should('be.visible');
    
    // Wait for commands to load and verify some commands are shown
    cy.get('[role="option"]', { timeout: 5000 }).should('have.length.greaterThan', 0);
  });

  it('should filter commands based on query', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Type slash + query
    textarea.type('/create');
    
    // Wait for filtered results
    cy.get('[role="option"]', { timeout: 5000 }).should('be.visible');
    
    // Should show commands matching "create"
    cy.get('[role="option"]').each(($option) => {
      cy.wrap($option).should('contain.text', 'create');
    });
  });

  it('should navigate menu with arrow keys', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Open menu
    textarea.type('/');
    
    // Wait for options to load
    cy.get('[role="option"]', { timeout: 5000 }).should('have.length.greaterThan', 1);
    
    // First option should be selected by default
    cy.get('[role="option"][aria-selected="true"]').should('have.length', 1);
    
    // Navigate down
    textarea.type('{downArrow}');
    
    // Second option should now be selected
    cy.get('[role="option"]').eq(1).should('have.attr', 'aria-selected', 'true');
    
    // Navigate up
    textarea.type('{upArrow}');
    
    // First option should be selected again
    cy.get('[role="option"]').eq(0).should('have.attr', 'aria-selected', 'true');
  });

  it('should insert command when pressing Enter', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Open menu
    textarea.type('/create');
    
    // Wait for filtered options
    cy.get('[role="option"]', { timeout: 5000 }).should('be.visible');
    
    // Press Enter to select first command
    textarea.type('{enter}');
    
    // Menu should close
    cy.get('[role="listbox"]').should('not.exist');
    
    // Command should be inserted into textarea
    textarea.should('contain.value', '/create-task');
  });

  it('should insert command when clicking on option', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Open menu
    textarea.type('/invoice');
    
    // Wait for options and click on one
    cy.get('[role="option"]', { timeout: 5000 }).first().click();
    
    // Menu should close
    cy.get('[role="listbox"]').should('not.exist');
    
    // Command should be inserted
    textarea.should('contain.value', '/send-invoice');
  });

  it('should close menu when pressing Escape', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Open menu
    textarea.type('/');
    
    // Wait for menu to appear
    cy.get('[role="listbox"]', { timeout: 5000 }).should('be.visible');
    
    // Press Escape
    textarea.type('{esc}');
    
    // Menu should close
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should show "no commands found" message for invalid query', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Type an invalid command
    textarea.type('/nonexistentcommand');
    
    // Should show no results message
    cy.contains('No commands found for "nonexistentcommand"').should('be.visible');
  });

  it('should show command categories and descriptions', () => {
    const textarea = cy.get('textarea[placeholder*="Type your message"]');
    
    // Open menu
    textarea.type('/');
    
    // Wait for commands to load
    cy.get('[role="option"]', { timeout: 5000 }).should('be.visible');
    
    // Check that commands have categories and descriptions
    cy.get('[role="option"]').first().within(() => {
      // Should have command name with slash
      cy.get('.font-medium').should('contain.text', '/');
      
      // Should have category badge
      cy.get('.text-xs').should('exist');
      
      // Should have description
      cy.get('.opacity-80').should('exist');
    });
  });
}); 