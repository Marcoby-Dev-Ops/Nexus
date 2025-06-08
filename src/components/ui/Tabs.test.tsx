/**
 * @file Tabs.test.tsx
 * @description Unit and snapshot tests for the Tabs component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs from './Tabs';

describe('Tabs', () => {
  const tabs = [
    { label: 'Tab 1', content: <div>Content 1</div> },
    { label: 'Tab 2', content: <div>Content 2</div> },
  ];

  it('renders tab labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('shows content for selected tab', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Tabs tabs={tabs} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 