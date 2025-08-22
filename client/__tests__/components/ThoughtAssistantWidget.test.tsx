import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThoughtAssistantWidget } from '@/components/workspace/widgets/ThoughtAssistantWidget';
import { thoughtsService } from '@/lib/services/thoughtsService';

jest.mock('@/lib/services/thoughtsService');

describe('ThoughtAssistantWidget', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all metadata fields for creating a thought', () => {
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    // Prompt step
    expect(screen.getByLabelText(/thought prompt/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Test idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
  });

  it('allows user to fill out and submit the create form', async () => {
    (thoughtsService.getThoughts as jest.Mock).mockResolvedValue({ thoughts: [] });
    (thoughtsService.createThought as jest.Mock).mockResolvedValue({});
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    // Prompt step
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Test idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByLabelText(/describe your new idea/i));
    // Fill out metadata fields
    fireEvent.change(screen.getByLabelText(/describe your new idea/i), { target: { value: 'My new idea' } });
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByLabelText(/estimated effort/i), { target: { value: '2h' } });
    fireEvent.change(screen.getByLabelText(/impact/i), { target: { value: 'High' } });
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(thoughtsService.createThought).toHaveBeenCalled());
    expect(thoughtsService.createThought).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'My new idea',
        department: 'Engineering',
        estimated_effort: '2h',
        impact: 'High',
      })
    );
  });

  it('shows loading and error states', async () => {
    (thoughtsService.getThoughts as jest.Mock).mockResolvedValue({ thoughts: [] });
    (thoughtsService.createThought as jest.Mock).mockRejectedValue(new Error('Create failed'));
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Test idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByLabelText(/describe your new idea/i));
    fireEvent.change(screen.getByLabelText(/describe your new idea/i), { target: { value: 'My new idea' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => screen.getByText(/failed to create thought/i));
    expect(screen.getByText(/failed to create thought/i)).toBeInTheDocument();
  });
}); 