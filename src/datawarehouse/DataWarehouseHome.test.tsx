/**
 * @file DataWarehouseHome.test.tsx
 * @description Unit and snapshot tests for the DataWarehouseHome component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataWarehouseHome from './DataWarehouseHome';

describe('DataWarehouseHome', () => {
  it('renders data warehouse title', () => {
    render(<DataWarehouseHome />);
    expect(screen.getByText(/data warehouse/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<DataWarehouseHome />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 