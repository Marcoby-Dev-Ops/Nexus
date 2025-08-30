/* eslint-disable */
// @ts-nocheck
/* global cy */

describe('OperationsDashboard – Playbook', () => {
  beforeEach(() => {
    cy.login(); // assumes custom login command exists
  });

  it('queues playbook & shows toast', () => {
    // Mock insert into ops_action_queue
    cy.intercept('POST', '**/rest/v1/ops_action_queue', {
      statusCode: 201,
      body: {},
    }).as('queuePlaybook');

    cy.visit('/operations');

    cy.findByRole('button', { name: /Run Playbook/i }).click();

    cy.wait('@queuePlaybook');

    cy.contains(/Playbook queued/i).should('exist');
  });
});

export {}; 