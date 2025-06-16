describe('StreamingComposer', () => {
  beforeEach(() => {
    // Set env flag before visiting
    cy.visit('/', {
      onBeforeLoad(win) {
        win.importMeta = { env: { VITE_CHAT_V2: '1' } };
      },
    });
  });

  it('renders and accepts input', () => {
    cy.get('textarea[placeholder="Type your message..."]').should('exist');
    cy.get('textarea').type('Test streaming');
    cy.contains('Test streaming').should('exist');
  });

  it('shows code copy button', () => {
    cy.contains('Copy Code (coming soon)').should('exist');
  });

  // TODO: Add streaming token E2E test
}); 