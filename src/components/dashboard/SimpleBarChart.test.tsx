/**
 * @file SimpleBarChart.test.tsx
 * @description Unit and snapshot tests for the SimpleBarChart component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimpleBarChart } from './SimpleBarChart';

describe('SimpleBarChart', () => {
  const mockData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 200 },
    { name: 'Mar', value: 150 },
  ];

  it('renders all bars', () => {
    render(<SimpleBarChart data={mockData} />);
    const bars = screen.getAllByRole('img', { hidden: true });
    expect(bars).toHaveLength(mockData.length);
  });

  it('renders labels for each bar', () => {
    render(<SimpleBarChart data={mockData} />);
    mockData.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it('renders values for each bar', () => {
    render(<SimpleBarChart data={mockData} />);
    mockData.forEach(item => {
      expect(screen.getByText(item.value.toString())).toBeInTheDocument();
    });
  });

  it('calculates bar heights correctly', () => {
    render(<SimpleBarChart data={mockData} />);
    const bars = screen.getAllByRole('img', { hidden: true });
    const maxValue = Math.max(...mockData.map(d => d.value));
    
    bars.forEach((bar, index) => {
      const expectedHeight = (mockData[index].value / maxValue) * 100;
      expect(bar).toHaveStyle(`height: ${expectedHeight}%`);
    });
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<SimpleBarChart data={mockData} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 