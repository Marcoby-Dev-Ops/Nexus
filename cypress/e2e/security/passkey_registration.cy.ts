describe('Passkey Registration & Management', () => {
  beforeEach(() => {
    // Setup authenticated user session
    cy.login(); // Assumes a custom command for login
    cy.visit('/settings/security');
  });

  describe('WebAuthn Support Detection', () => {
    it('should show fallback banner when WebAuthn is not supported', () => {
      // Mock navigator.credentials to be undefined to simulate unsupported browser
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'credentials', {
          value: undefined,
          writable: true
        });
      });

      cy.reload();
      
      cy.contains('Passkeys not supported').should('be.visible');
      cy.contains('Your browser doesn\'t support passkeys').should('be.visible');
      cy.get('[data-testid="add-passkey-button"]').should('be.disabled');
    });

    it('should enable passkey functionality when WebAuthn is supported', () => {
      cy.contains('Passkeys (WebAuthn)').should('be.visible');
      cy.get('[data-testid="add-passkey-button"]').should('not.be.disabled');
    });
  });

  describe('Passkey Registration Flow', () => {
    it('should successfully register a new passkey with friendly name', () => {
      // Mock WebAuthn API responses
      cy.window().then((win) => {
        // Mock successful passkey registration
        const mockCredential = {
          id: 'mock-credential-id-12345',
          rawId: new ArrayBuffer(32),
          response: {
            clientDataJSON: new ArrayBuffer(100),
            attestationObject: new ArrayBuffer(200)
          },
          type: 'public-key'
        };

        cy.stub(win.navigator.credentials, 'create').resolves(mockCredential);
      });

      // Intercept API calls
      cy.intercept('POST', '**/functions/v1/passkey-register-challenge', {
        statusCode: 200,
        body: {
          challenge: 'mock-challenge-string',
          rp: { name: 'Nexus', id: 'nexus.ai' },
          user: { id: 'user-id', name: 'test@example.com', displayName: 'Test User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          attestation: 'none'
        }
      }).as('registerChallenge');

      cy.intercept('POST', '**/functions/v1/passkey-register-verify', {
        statusCode: 200,
        body: { verified: true }
      }).as('registerVerify');

      // Start passkey registration
      cy.get('[data-testid="add-passkey-button"]').click();
      
      // Dialog should open
      cy.contains('Add New Passkey').should('be.visible');
      cy.contains('Give your passkey a name').should('be.visible');

      // Enter friendly name
      cy.get('[data-testid="passkey-name-input"]').type('MacBook Touch ID');

      // Click create passkey
      cy.get('[data-testid="create-passkey-button"]').click();

      // Verify API calls
      cy.wait('@registerChallenge').then((interception) => {
        expect(interception.request.body).to.deep.include({
          userId: Cypress.env('TEST_USER_ID'),
          friendlyName: 'MacBook Touch ID'
        });
      });

      cy.wait('@registerVerify').then((interception) => {
        expect(interception.request.body).to.have.property('userId');
        expect(interception.request.body).to.have.property('attestationResponse');
        expect(interception.request.body).to.have.property('friendlyName', 'MacBook Touch ID');
      });

      // Success feedback
      cy.contains('Passkey added successfully').should('be.visible');
      
      // Dialog should close
      cy.contains('Add New Passkey').should('not.exist');

      // New passkey should appear in the list
      cy.contains('MacBook Touch ID').should('be.visible');
      cy.contains('Multi-device').should('be.visible');
    });

    it('should handle registration without friendly name', () => {
      // Mock WebAuthn API
      cy.window().then((win) => {
        const mockCredential = {
          id: 'mock-credential-id-67890',
          rawId: new ArrayBuffer(32),
          response: {
            clientDataJSON: new ArrayBuffer(100),
            attestationObject: new ArrayBuffer(200)
          },
          type: 'public-key'
        };

        cy.stub(win.navigator.credentials, 'create').resolves(mockCredential);
      });

      cy.intercept('POST', '**/functions/v1/passkey-register-challenge', {
        statusCode: 200,
        body: { challenge: 'mock-challenge' }
      }).as('registerChallenge');

      cy.intercept('POST', '**/functions/v1/passkey-register-verify', {
        statusCode: 200,
        body: { verified: true }
      }).as('registerVerify');

      // Start registration without entering name
      cy.get('[data-testid="add-passkey-button"]').click();
      cy.get('[data-testid="create-passkey-button"]').click();

      cy.wait('@registerChallenge');
      cy.wait('@registerVerify');

      // Should show default name
      cy.contains('Unnamed Passkey').should('be.visible');
    });

    it('should handle registration errors gracefully', () => {
      // Mock WebAuthn failure
      cy.window().then((win) => {
        cy.stub(win.navigator.credentials, 'create').rejects(new Error('User cancelled'));
      });

      cy.intercept('POST', '**/functions/v1/passkey-register-challenge', {
        statusCode: 200,
        body: { challenge: 'mock-challenge' }
      }).as('registerChallenge');

      cy.get('[data-testid="add-passkey-button"]').click();
      cy.get('[data-testid="create-passkey-button"]').click();

      // Should show error message
      cy.contains('User cancelled').should('be.visible');
      
      // Dialog should remain open for retry
      cy.contains('Add New Passkey').should('be.visible');
    });

    it('should handle server errors during registration', () => {
      cy.intercept('POST', '**/functions/v1/passkey-register-challenge', {
        statusCode: 400,
        body: { error: 'Registration challenge failed' }
      }).as('registerChallenge');

      cy.get('[data-testid="add-passkey-button"]').click();
      cy.get('[data-testid="create-passkey-button"]').click();

      cy.wait('@registerChallenge');

      // Should show server error
      cy.contains('Registration challenge failed').should('be.visible');
    });
  });

  describe('Passkey Management', () => {
    beforeEach(() => {
      // Mock existing passkeys
      cy.intercept('GET', '**/rest/v1/ai_passkeys*', {
        statusCode: 200,
        body: [
          {
            credential_id: 'existing-cred-1',
            friendly_name: 'iPhone Face ID',
            created_at: '2024-01-01T00:00:00Z',
            device_type: 'multi_device'
          },
          {
            credential_id: 'existing-cred-2',
            friendly_name: null,
            created_at: '2024-01-02T00:00:00Z',
            device_type: 'single_device'
          }
        ]
      }).as('getPasskeys');

      cy.reload();
      cy.wait('@getPasskeys');
    });

    it('should display existing passkeys correctly', () => {
      cy.contains('iPhone Face ID').should('be.visible');
      cy.contains('Unnamed Passkey').should('be.visible');
      cy.contains('Multi-device').should('be.visible');
      cy.contains('Single-device').should('be.visible');
      
      // Should show active badges
      cy.get('[data-testid="passkey-badge-active"]').should('have.length', 2);
    });

    it('should successfully delete a passkey', () => {
      cy.intercept('DELETE', '**/rest/v1/ai_passkeys*', {
        statusCode: 200,
        body: {}
      }).as('deletePasskey');

      // Click delete button for first passkey
      cy.get('[data-testid="delete-passkey-existing-cred-1"]').click();

      cy.wait('@deletePasskey').then((interception) => {
        expect(interception.request.url).to.include('credential_id=eq.existing-cred-1');
      });

      // Success message
      cy.contains('Passkey deleted successfully').should('be.visible');
      
      // Passkey should be removed from list
      cy.contains('iPhone Face ID').should('not.exist');
    });

    it('should handle deletion errors', () => {
      cy.intercept('DELETE', '**/rest/v1/ai_passkeys*', {
        statusCode: 400,
        body: { error: 'Deletion failed' }
      }).as('deletePasskey');

      cy.get('[data-testid="delete-passkey-existing-cred-1"]').click();

      cy.wait('@deletePasskey');

      // Should show error message
      cy.contains('Deletion failed').should('be.visible');
      
      // Passkey should still be in list
      cy.contains('iPhone Face ID').should('be.visible');
    });

    it('should show loading state during deletion', () => {
      cy.intercept('DELETE', '**/rest/v1/ai_passkeys*', {
        statusCode: 200,
        body: {},
        delay: 1000 // Add delay to see loading state
      }).as('deletePasskey');

      cy.get('[data-testid="delete-passkey-existing-cred-1"]').click();

      // Button should be disabled during deletion
      cy.get('[data-testid="delete-passkey-existing-cred-1"]').should('be.disabled');

      cy.wait('@deletePasskey');
    });
  });

  describe('Passkey Authentication Integration', () => {
    it('should show passkey option in login form', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="passkey-signin-button"]').should('be.visible');
      cy.get('[data-testid="passkey-signin-button"]').should('not.be.disabled');
    });

    it('should handle successful passkey authentication', () => {
      // Mock WebAuthn authentication
      cy.window().then((win) => {
        const mockAssertion = {
          id: 'existing-cred-1',
          rawId: new ArrayBuffer(32),
          response: {
            clientDataJSON: new ArrayBuffer(100),
            authenticatorData: new ArrayBuffer(50),
            signature: new ArrayBuffer(64)
          },
          type: 'public-key'
        };

        cy.stub(win.navigator.credentials, 'get').resolves(mockAssertion);
      });

      cy.intercept('POST', '**/functions/v1/passkey-auth-challenge', {
        statusCode: 200,
        body: {
          challenge: 'auth-challenge',
          userId: 'test-user-id',
          allowCredentials: [{ id: 'existing-cred-1', type: 'public-key' }]
        }
      }).as('authChallenge');

      cy.intercept('POST', '**/functions/v1/passkey-auth-verify', {
        statusCode: 200,
        body: {
          verified: true,
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token'
        }
      }).as('authVerify');

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="passkey-signin-button"]').click();

      cy.wait('@authChallenge');
      cy.wait('@authVerify');

      // Should redirect to dashboard after successful auth
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Security Settings Integration', () => {
    it('should integrate with password change functionality', () => {
      // Verify password change form exists alongside passkeys
      cy.contains('Change Password').should('be.visible');
      cy.contains('Passkeys (WebAuthn)').should('be.visible');
      
      // Both sections should be functional
      cy.get('[data-testid="current-password-input"]').should('be.visible');
      cy.get('[data-testid="add-passkey-button"]').should('be.visible');
    });

    it('should show security activity including passkey usage', () => {
      cy.contains('Recent Security Activity').should('be.visible');
      
      // Should show various login methods
      cy.contains('Login').should('be.visible');
      cy.contains('Chrome on MacOS').should('be.visible');
    });

    it('should handle RLS (Row Level Security) correctly', () => {
      // Passkeys should only show for the current user
      cy.intercept('GET', '**/rest/v1/ai_passkeys*', (req) => {
        // Verify RLS headers are present
        expect(req.headers).to.have.property('authorization');
        expect(req.url).to.include('user_id=eq.');
      }).as('getPasskeysWithRLS');

      cy.reload();
      cy.wait('@getPasskeysWithRLS');
    });
  });
}); 