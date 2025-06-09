import { render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';

/**
 * @name Checkbox.test
 * @description Test suite for the Checkbox component
 */
describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<Checkbox label="Test checkbox" />);
    const label = screen.getByText('Test checkbox');
    expect(label).toBeInTheDocument();
  });

  it('handles checked state correctly', () => {
    render(<Checkbox checked={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('can be disabled', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });
}); 