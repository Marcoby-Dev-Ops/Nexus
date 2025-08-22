/* eslint-disable */
// @ts-nocheck
/* global cy */

describe('OperationsDashboard', () => {
  it('displays ops score', () => {
    // Mock the operations score calculation
    cy.intercept('POST', '**/api/operations/score', {
      statusCode: 200,
      body: { score: 0.82 },
    }).as('calcOps');

    cy.visit('/operations');

    cy.wait('@calcOps');

    cy.contains('Operations Score')
      .parent()
      .should('contain.text', '82.0%');
  });
});

export {}; 