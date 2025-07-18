/**
 * @file Dropdown.test.tsx
 * @description Unit and snapshot tests for the Dropdown component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from './Dropdown';
import { Button } from '@/shared/components/ui/Button';

/**
 * Mock props for Dropdown
 */
const items = [
  { label: 'Option 1', value: '1', onClick: jest.fn() },
  { label: 'Option 2', value: '2', onClick: jest.fn() },
];

describe('Dropdown', () => {
  it('renders trigger and options when opened', () => {
    render(<Dropdown items={items} trigger={<Button>Open</Button>} />);
    const trigger = screen.getByText('Open');
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onClick when an option is selected', () => {
    render(<Dropdown items={items} trigger={<Button>Open</Button>} />);
    const trigger = screen.getByText('Open');
    fireEvent.click(trigger);

    const option2 = screen.getByText('Option 2');
    fireEvent.click(option2);
    expect(items[1].onClick).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Dropdown items={items} trigger={<Button>Open</Button>} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 