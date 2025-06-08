/**
 * @file Button.test.tsx
 * @description Unit tests for the Button component using React Testing Library and Jest.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText(/click me/i));
    expect(handleClick).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Button>Snapshot Button</Button>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 