import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
<<<<<<< HEAD
import { authService, type AuthUser } from '../services/auth';
=======
import { apiService } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string;
  points?: number;
  level?: string;
}
>>>>>>> cuoidino/main

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
<<<<<<< HEAD
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
=======
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
>>>>>>> cuoidino/main
  requireAuth: (action: () => void) => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
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
<<<<<<< HEAD
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
=======
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiService.setToken(token);
      loadCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      const userData = response.user;
      
      // Transform backend user data to frontend format
      const transformedUser: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`,
        points: 1250, // Mock data for now
        level: userData.role === 'admin' ? 'Admin' : 'Gold Member'
      };
      
      setUser(transformedUser);
    } catch (error) {
      console.error('Failed to load current user:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      apiService.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      
      // Set token
      apiService.setToken(response.token);
      
      // Transform user data
      const userData = response.user;
      const transformedUser: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`,
        points: 1250,
        level: userData.role === 'admin' ? 'Admin' : 'Gold Member'
      };
      
      setUser(transformedUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiService.register(userData);
      
      // Set token
      apiService.setToken(response.token);
      
      // Transform user data
      const user = response.user;
      const transformedUser: User = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: 'user',
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`,
        points: 0,
        level: 'New Member'
      };
      
      setUser(transformedUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    apiService.setToken(null);
>>>>>>> cuoidino/main
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

  // Create a user object with name property for backward compatibility
  const userWithName = user ? {
    ...user,
    name: `${user.first_name} ${user.last_name}`
  } : null;

  const value: AuthContextType = {
    user: userWithName,
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