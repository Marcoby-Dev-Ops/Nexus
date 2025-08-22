import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThoughtAssistantWidget } from '@/components/workspace/widgets/ThoughtAssistantWidget';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ThoughtAssistantWidget Integration', () => {
  const onClose = jest.fn();

  it('creates a new thought with all metadata (success)', async () => {
    server.use(
      rest.get('/api/thoughts', (req, res, ctx) => res(ctx.json({ thoughts: [] }))),
      rest.post('/api/thoughts', (req, res, ctx) => {
        const body = req.body as any;
        expect(body.content).toBe('My new idea');
        expect(body.department).toBe('Engineering');
        expect(body.estimated_effort).toBe('2h');
        expect(body.impact).toBe('High');
        return res(ctx.status(201), ctx.json({ id: 'thought-1', ...body }));
      })
    );
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Test idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByLabelText(/describe your new idea/i));
    fireEvent.change(screen.getByLabelText(/describe your new idea/i), { target: { value: 'My new idea' } });
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByLabelText(/estimated effort/i), { target: { value: '2h' } });
    fireEvent.change(screen.getByLabelText(/impact/i), { target: { value: 'High' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument());
  });

  it('handles backend error on create', async () => {
    server.use(
      rest.get('/api/thoughts', (req, res, ctx) => res(ctx.json({ thoughts: [] }))),
      rest.post('/api/thoughts', (req, res, ctx) => res(ctx.status(500), ctx.json({ error: 'Create failed' })))
    );
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Test idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByLabelText(/describe your new idea/i));
    fireEvent.change(screen.getByLabelText(/describe your new idea/i), { target: { value: 'My new idea' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => screen.getByText(/failed to create thought/i));
    expect(screen.getByText(/failed to create thought/i)).toBeInTheDocument();
  });

  it('updates an existing thought (success)', async () => {
    // Simulate a match found, then update
    server.use(
      rest.get('/api/thoughts', (req, res, ctx) => res(ctx.json({ thoughts: [{ id: 'thought-1', content: 'Old idea', category: 'idea', status: 'concept', department: '', priority: 'medium', estimated_effort: '', personal_or_professional: 'professional', initiative: false, impact: '', workflow_stage: 'create_idea', interaction_method: 'text' }] }))),
      rest.put('/api/thoughts/thought-1', (req, res, ctx) => {
        const body = req.body as any;
        expect(body.content).toBe('Updated idea');
        expect(body.department).toBe('Engineering');
        return res(ctx.status(200), ctx.json({ ...body }));
      })
    );
    render(<ThoughtAssistantWidget open={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/thought prompt/i), { target: { value: 'Old idea' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByText(/we found related thoughts/i));
    fireEvent.click(screen.getByRole('button', { name: /old idea/i }));
    await waitFor(() => screen.getByLabelText(/update thought/i));
    fireEvent.change(screen.getByLabelText(/update thought/i), { target: { value: 'Updated idea' } });
    fireEvent.change(screen.getByLabelText(/department-update/i), { target: { value: 'Engineering' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument());
  });
}); 