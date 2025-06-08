/**
 * @file Avatar.test.tsx
 * @description Unit and snapshot tests for the Avatar component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders with alt text', () => {
    render(<Avatar src="/avatar.png" alt="User Avatar" />);
    expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Avatar src="/avatar.png" alt="User Avatar" />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 