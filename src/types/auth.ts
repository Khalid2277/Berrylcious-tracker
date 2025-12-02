export type UserRole = 'owner' | 'seller';

export interface User {
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

