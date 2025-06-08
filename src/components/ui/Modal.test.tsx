/**
 * @file Modal.test.tsx
 * @description Unit and snapshot tests for the Modal component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from './Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal open={true} onClose={jest.fn()}>Modal Content</Modal>);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Modal open={true} onClose={handleClose}>Modal Content</Modal>);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Modal open={true} onClose={jest.fn()}>Snapshot Modal</Modal>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 