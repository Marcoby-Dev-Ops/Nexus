/**
 * @file Avatar.test.tsx
 * @description Unit and snapshot tests for the Avatar component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';

describe('Avatar', () => {
  it('renders with alt text', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User Avatar" />
        <AvatarFallback>UA</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User Avatar" />
        <AvatarFallback>UA</AvatarFallback>
      </Avatar>
    );
    expect(asFragment()).toMatchSnapshot();
  });
}); 