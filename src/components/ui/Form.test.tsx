/**
 * @file Form.test.tsx
 * @description Unit and snapshot tests for the Form component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from './Form';

describe('Form', () => {
  it('renders children', () => {
    render(<Form>Form Content</Form>);
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('calls onSubmit when submitted', () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    render(<Form onSubmit={handleSubmit}><button type="submit">Submit</button></Form>);
    fireEvent.click(screen.getByText('Submit'));
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Form>Snapshot Form</Form>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 