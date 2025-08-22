/**
 * @file DataWarehouseHome.test.tsx
 * @description Unit and snapshot tests for the DataWarehouseHome component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataWarehouseHome from '../../../src/pages/analytics/DataWarehouseHome';

describe('DataWarehouseHome', () => {
  it('renders analytics title', () => {
    render(<DataWarehouseHome />);
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<DataWarehouseHome />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 