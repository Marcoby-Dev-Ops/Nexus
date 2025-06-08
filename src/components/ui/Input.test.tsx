/**
 * @file Input.test.tsx
 * @description Unit and snapshot tests for the Input component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Type here" onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Input placeholder="Type here" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText('Type here'), { target: { value: 'Hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Input placeholder="Type here" onChange={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 