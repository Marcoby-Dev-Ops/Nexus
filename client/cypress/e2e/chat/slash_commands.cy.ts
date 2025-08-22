/// <reference types="cypress" />

describe('Slash Commands in Chat', () => {
  beforeEach(() => {
    // Visit the chat page
    cy.visit('/chat');
    
    // Wait for the page to load and authenticate if needed
    cy.get('textarea[placeholder="Type your message..."]', { timeout: 10000 }).should('be.visible');
  });

  it('shows slash command menu when typing /', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to trigger the command menu
    textarea.type('/');
    
    // Should show the command menu
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[aria-label="Slash command suggestions"]').should('be.visible');
  });

  it('filters commands as user types', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash and partial command
    textarea.type('/create');
    
    // Should show filtered commands
    cy.get('[role="listbox"]').should('be.visible');
    cy.contains('/create-task').should('be.visible');
    cy.contains('/create-proposal').should('be.visible');
    
    // Should not show unrelated commands
    cy.contains('/send-invoice').should('not.exist');
  });

  it('inserts command when clicked', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to show commands
    textarea.type('/');
    
    // Wait for commands to load and click one
    cy.get('[role="listbox"]').should('be.visible');
    cy.contains('/create-task').click();
    
    // Should insert the command in the textarea
    textarea.should('have.value', '/create-task ');
    
    // Command menu should disappear
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('navigates commands with arrow keys', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to show commands
    textarea.type('/');
    
    // Wait for commands to load
    cy.get('[role="listbox"]').should('be.visible');
    
    // Use arrow keys to navigate
    textarea.type('{downarrow}');
    
    // Should highlight the second command
    cy.get('[aria-selected="true"]').should('exist');
    
    // Press Enter to select
    textarea.type('{enter}');
    
    // Should insert the selected command
    textarea.should('contain.value', '/');
  });

  it('shows command categories and descriptions', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to show commands
    textarea.type('/');
    
    // Wait for commands to load
    cy.get('[role="listbox"]').should('be.visible');
    
    // Should show command with category badge
    cy.contains('productivity').should('be.visible');
    cy.contains('finance').should('be.visible');
    cy.contains('sales').should('be.visible');
    
    // Should show descriptions
    cy.contains('Create a task in your project management tool').should('be.visible');
    cy.contains('Send a Stripe invoice to a customer').should('be.visible');
  });

  it('closes menu on Escape key', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to show commands
    textarea.type('/');
    
    // Wait for commands to load
    cy.get('[role="listbox"]').should('be.visible');
    
    // Press Escape
    textarea.type('{esc}');
    
    // Menu should disappear
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('shows "no commands found" for invalid queries', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash and invalid command
    textarea.type('/nonexistent');
    
    // Should show no results message
    cy.contains('No commands found for "nonexistent"').should('be.visible');
  });

  it('loads commands dynamically from database', () => {
    const textarea = cy.get('textarea[placeholder="Type your message..."]');
    
    // Type a slash to show commands
    textarea.type('/');
    
    // Should show loading state initially (might be very fast)
    // Then show the actual commands from database
    cy.get('[role="listbox"]').should('be.visible');
    
    // Verify we have more than the original 4 static commands
    // We should have 8 commands from the database
    cy.get('[role="option"]').should('have.length.at.least', 6);
    
    // Verify some of the new commands are present
    cy.contains('/schedule-meeting').should('be.visible');
    cy.contains('/send-email').should('be.visible');
    cy.contains('/sync-data').should('be.visible');
  });
}); 