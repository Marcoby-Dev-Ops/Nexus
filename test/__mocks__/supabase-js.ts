const mockSupabase = {
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      })),
    },
  },
};

export default mockSupabase; 