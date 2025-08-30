/// <reference types="cypress" />

describe('StreamingComposer – streaming flow', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Enable the v2 chat feature flag and set a predictable endpoint path
        (win as any).importMeta = {
          env: {
    
            VITE_AI_CHAT_URL: '/functions/v1/ai_chat',
          },
        };

        // Stub window.fetch to simulate a streaming response
        cy.stub(win, 'fetch').callsFake((_url: RequestInfo, _init?: RequestInit) => {
          const encoder = new TextEncoder();
          const chunks = ['Hello ', 'world!'];

          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
              controller.close();
            },
          });

          const response = new Response(stream, {
            status: 200,
            headers: {
              'x-conversation-id': 'test-conv-1',
            },
          });

          return Promise.resolve(response);
        });
      },
    });
  });

  it('streams assistant response', () => {
    cy.get('textarea[placeholder="Type your message..."]').type('Hi there');
    cy.contains('button', 'Send').click();

    // Wait for streaming chunks to appear merged
    cy.contains('Hello world!').should('exist');
  });
}); 