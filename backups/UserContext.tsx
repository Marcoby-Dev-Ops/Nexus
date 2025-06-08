import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  initials: string;
  department?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * @name UserProvider
 * @description Provides user state management to the application.
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The rendered UserProvider component.
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo user - in real app this would come from authentication
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@nexus.com',
    role: 'admin',
    initials: 'JD',
    department: 'Operations',
    preferences: {
      theme: 'system',
      notifications: true,
      language: 'en',
    },
  });

  const isAuthenticated = user !== null;

  const login = useCallback((newUser: User) => {
    setUser(newUser);
    // In real app, would save to localStorage/cookies
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // In real app, would clear localStorage/cookies and redirect
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updatePreferences = useCallback((preferences: Partial<User['preferences']>) => {
    setUser(prev => prev ? {
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    } : null);
  }, []);

  const value: UserContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    updatePreferences,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * @name useUser
 * @description Hook to access user context.
 * @returns {UserContextType} The user context value.
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * @name getUserDisplayName
 * @description Utility function to get display name for user.
 * @param {User} user - The user object.
 * @returns {string} The display name.
 */
export const getUserDisplayName = (user: User): string => {
  return user.name || user.email;
};

/**
 * @name getUserInitials
 * @description Utility function to get initials from user name.
 * @param {string} name - The user's name.
 * @returns {string} The initials.
 */
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}; 