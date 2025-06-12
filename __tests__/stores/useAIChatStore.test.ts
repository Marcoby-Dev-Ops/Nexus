import { useAIChatStore } from '../../src/lib/stores/useAIChatStore';

describe('useAIChatStore', () => {
  beforeEach(() => {
    useAIChatStore.getState().reset();
  });

  it('optimistically appends user message', async () => {
    const convId = await useAIChatStore.getState().newConversation('Test');
    await useAIChatStore.getState().sendMessage(convId, 'Hello world', 'user-1');
    const conv = useAIChatStore.getState().conversations[convId];
    expect(conv.messages[0].content).toBe('Hello world');
    expect(conv.messages[0].role).toBe('user');
  });

  it('resets store', () => {
    const convId = 'reset-test';
    useAIChatStore.getState().conversations[convId] = {
      id: convId,
      title: 'Reset',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAIChatStore.getState().reset();
    expect(Object.keys(useAIChatStore.getState().conversations)).toHaveLength(0);
  });
}); 