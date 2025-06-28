import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type AuthUser } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  onRequireLogin: () => void;
}

export const AuthProvider = ({ children, onRequireLogin }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialUser();

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: authUser } = await authService.signIn(email, password);
    if (authUser) {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    const { user: authUser } = await authService.signUp(email, password, fullName);
    if (authUser) {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: any) => {
    await authService.updateProfile(updates);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      onRequireLogin();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    requireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};