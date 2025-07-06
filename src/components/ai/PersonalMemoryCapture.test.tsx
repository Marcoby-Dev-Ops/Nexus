import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalMemoryCapture } from './PersonalMemoryCapture';
import { supabase } from '@/lib/core/supabase';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersonalMemoryCapture', () => {
  it('saves personal thought to personal_thoughts table with context', async () => {
    const fromSpy = jest.spyOn(supabase, 'from');
    const insertSpy = jest.fn().mockResolvedValue({ error: null });
    fromSpy.mockReturnValue({ insert: insertSpy } as any);

    render(<PersonalMemoryCapture currentContext={{ department: 'Sales' }} />);

    // Open the capture form
    fireEvent.click(screen.getByText(/Capture Thought/i));

    // Enter thought content
    const textarea = screen.getByPlaceholderText(/What's on your mind/i);
    fireEvent.change(textarea, { target: { value: 'Improve lead response time' } });

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /Save Thought/i }));

    await waitFor(() => expect(insertSpy).toHaveBeenCalled());

    // Ensure correct table and payload
    expect(fromSpy).toHaveBeenCalledWith('personal_thoughts');

    const payload = insertSpy.mock.calls[0][0][0];
    expect(payload.content).toBe('Improve lead response time');
    expect(payload.business_context).toEqual({ department: 'Sales' });

    fromSpy.mockRestore();
  });
}); 