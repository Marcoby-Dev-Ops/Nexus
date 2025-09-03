import React from 'react';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '@/shared/pages/LandingPage';

expect.extend(toHaveNoViolations);
const axe = configureAxe({
  rules: {
    // Keep tests stable in CI; adjust as needed.
    'region': { enabled: true },
  },
});

describe('Accessibility: LandingPage', () => {
  it('has no detectable a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});


