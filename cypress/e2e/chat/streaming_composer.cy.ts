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

  it('sends POST request with stream=1 flag', () => {
    cy.intercept('POST', /ai_chat\?stream=1/).as('chatStream');

    cy.get('textarea').type('Hello{enter}');

    cy.wait('@chatStream').its('request.url').should('include', 'stream=1');
  });
}); 