import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';

interface User {
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkAuthStatus = () => {
    const isAuth = authService.isAuthenticated();
    console.log('Checking auth status:', { isAuth });
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      const storedUsername = localStorage.getItem('username');
      const storedEmail = localStorage.getItem('email');
      if (storedUsername) {
        setUser({ 
          email: storedEmail || '',
          username: storedUsername 
        });
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Check authentication status when localStorage changes
    const handleStorageChange = () => {
      console.log('Storage changed, checking auth status');
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    clearError();
    try {
      console.log('Attempting login in AuthContext');
      const response = await authService.login({ email, password });
      console.log('Login successful, checking auth status');
      checkAuthStatus();
      if (authService.isAuthenticated()) {
        console.log('Authentication confirmed, navigating to dashboard');
        // Store email in localStorage
        localStorage.setItem('email', email);
        navigate('/');
      } else {
        console.log('Authentication failed after successful login');
        throw new Error('Failed to authenticate after login');
      }
    } catch (error: any) {
      console.error('Login error in AuthContext:', error);
      setError(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    clearError();
    try {
      console.log('Attempting signup in AuthContext');
      const response = await authService.register({ email, password, name });
      console.log('Signup successful, checking auth status');
      checkAuthStatus();
      if (authService.isAuthenticated()) {
        console.log('Authentication confirmed, navigating to dashboard');
        // Store email in localStorage
        localStorage.setItem('email', email);
        navigate('/');
      } else {
        console.log('Authentication failed after successful signup');
        throw new Error('Failed to authenticate after signup');
      }
    } catch (error: any) {
      console.error('Signup error in AuthContext:', error);
      setError(error.message);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out in AuthContext');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    clearError();
    navigate('/login');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
