import React, { useState } from 'react';

interface AuthFormProps {
  onSubmit: (email: string, password: string) => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, loading = false, error, submitLabel = 'Sign In' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Authentication form" className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </div>
      {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Loading...' : submitLabel}
      </button>
    </form>
  );
};

export default AuthForm; 