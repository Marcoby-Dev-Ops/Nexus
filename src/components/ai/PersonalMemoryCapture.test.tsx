import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalMemoryCapture } from './PersonalMemoryCapture';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
let insertMock: jest.Mock;
let fromMock: jest.Mock;

jest.mock('@/lib/supabase', () => {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const from = jest.fn(() => ({ insert }));
  insertMock = insert;
  fromMock = from;
  return {
    supabase: {
      from,
      functions: {
        invoke: jest.fn().mockResolvedValue({}),
      },
    },
  };
});

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersonalMemoryCapture', () => {
  it('saves personal thought to personal_thoughts table with context', async () => {
    render(<PersonalMemoryCapture currentContext={{ department: 'Sales' }} />);

    // Open the capture form
    fireEvent.click(screen.getByText(/Capture Thought/i));

    // Enter thought content
    const textarea = screen.getByPlaceholderText(/What's on your mind/i);
    fireEvent.change(textarea, { target: { value: 'Improve lead response time' } });

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /Save Thought/i }));

    await waitFor(() => expect(insertMock).toHaveBeenCalled());

    // Ensure correct table and payload
    expect(fromMock).toHaveBeenCalledWith('personal_thoughts');

    const payload = insertMock.mock.calls[0][0][0];
    expect(payload.content).toBe('Improve lead response time');
    expect(payload.business_context).toEqual({ department: 'Sales' });
  });
}); 