/**
 * @file Dropdown.test.tsx
 * @description Unit and snapshot tests for the Dropdown component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from './Dropdown';

/**
 * Mock props for Dropdown
 */
const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
];

describe('Dropdown', () => {
  it('renders with options', () => {
    render(<Dropdown options={options} onChange={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    const handleChange = jest.fn();
    render(<Dropdown options={options} onChange={handleChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Dropdown options={options} onChange={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 