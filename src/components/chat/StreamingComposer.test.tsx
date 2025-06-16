import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamingComposer } from './StreamingComposer';

describe('StreamingComposer', () => {
  beforeAll(() => {
    // Mock VITE_CHAT_V2 env
    (import.meta as any).env = { ...import.meta.env, VITE_CHAT_V2: '1' };
  });

  it('renders textarea and markdown preview', () => {
    render(<StreamingComposer />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Copy Code (coming soon)')).toBeInTheDocument();
  });

  it('updates preview on input', () => {
    render(<StreamingComposer />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello **world**' } });
    expect(screen.getByText('Hello **world**')).toBeInTheDocument();
  });
}); 