'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticateUser, getUserByUsername, type DatabaseUser } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'owner' | 'seller';

export interface User {
  username: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback hardcoded users (used when Supabase is not configured)
const FALLBACK_USERS: Array<{ username: string; password: string; role: UserRole; name: string }> = [
  {
    username: 'Gohan',
    password: 'Gohan3322@',
    role: 'owner',
    name: 'Gohan',
  },
  {
    username: 'Aliamiri',
    password: 'Ali1234@',
    role: 'owner',
    name: 'Aliamiri',
  },
  {
    username: 'Jenny',
    password: 'Jenny123',
    role: 'seller',
    name: 'Jenny',
  },
];

const AUTH_STORAGE_KEY = 'berry_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // If Supabase is configured, verify user exists in database
          if (isSupabaseConfigured()) {
            const dbUser = await getUserByUsername(parsed.username);
            if (dbUser) {
              setUser({
                username: dbUser.username,
                role: dbUser.role,
                name: dbUser.name,
              });
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } else {
            // Fallback to hardcoded users
            const foundUser = FALLBACK_USERS.find(u => u.username === parsed.username);
            if (foundUser) {
              setUser({
                username: foundUser.username,
                role: foundUser.role,
                name: foundUser.name,
              });
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Try database authentication first if Supabase is configured
    if (isSupabaseConfigured()) {
      const dbUser = await authenticateUser(username, password);
      if (dbUser) {
        const userToStore: User = {
          username: dbUser.username,
          role: dbUser.role,
          name: dbUser.name,
        };
        setUser(userToStore);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToStore));
        return true;
      }
    }

    // Fallback to hardcoded users if Supabase is not configured
    const foundUser = FALLBACK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      const userToStore: User = {
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
      };
      setUser(userToStore);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToStore));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

