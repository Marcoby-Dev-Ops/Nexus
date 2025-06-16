/* eslint-disable */
// @ts-nocheck
/* global cy */

describe('OperationsDashboard', () => {
  it('displays ops score', () => {
    // Mock the Supabase RPC response
    cy.intercept('POST', '**/rpc/calc_ops_score', {
      statusCode: 200,
      body: 0.82,
    }).as('calcOps');

    cy.visit('/operations');

    cy.wait('@calcOps');

    cy.contains('Operations Score')
      .parent()
      .should('contain.text', '82.0%');
  });
});

export {}; 