import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  vehicleType?: string;
  preferredPlatform?: string;
  createdAt: string;
  phoneNumber?: string;
  profileImage?: string;
  theme?: string;
  language?: string;
  goals?: string;
  budgets?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (newData: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_USER = {
  _id: 'user1',
  fullName: 'Alex Doe',
  email: 'alex.doe@example.com',
  password: 'password', // For mock matching on frontend
  phoneNumber: '+91 98765 43210',
  vehicleType: 'Honda Activa 6G',
  preferredPlatform: 'swiggy',
  createdAt: new Date().toISOString()
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session and verify with backend
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (savedToken) {
        try {
          if (savedUserStr) {
            setUser(JSON.parse(savedUserStr));
          }
          setToken(savedToken);

          // Get latest user profile from the server to keep state sync'ed
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          
          if (res.data.success) {
            const fetchedUser = res.data.data;
            setUser(fetchedUser);
            if (localStorage.getItem('token')) {
              localStorage.setItem('user', JSON.stringify(fetchedUser));
            } else {
              sessionStorage.setItem('user', JSON.stringify(fetchedUser));
            }
          } else {
            throw new Error('Session invalid');
          }
        } catch (e) {
          // Clear corrupted/expired session
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Update Axios default auth header whenever the token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email: string, passwordStr: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password: passwordStr });
      if (res.data.success) {
        const { token: receivedToken, ...userSessionData } = res.data.data;
        setToken(receivedToken);
        setUser(userSessionData);

        if (rememberMe) {
          localStorage.setItem('token', receivedToken);
          localStorage.setItem('user', JSON.stringify(userSessionData));
        } else {
          sessionStorage.setItem('token', receivedToken);
          sessionStorage.setItem('user', JSON.stringify(userSessionData));
        }
      } else {
        throw new Error(res.data.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Invalid email or password.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook', rememberMe = true): Promise<void> => {
    setIsLoading(true);
    return new Promise<void>(async (resolve, reject) => {
      let popup: Window | null = null;
      let messageHandler: ((event: MessageEvent) => void) | null = null;
      let pollTimer: any = null;

      const cleanup = () => {
        if (messageHandler) {
          window.removeEventListener('message', messageHandler);
        }
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        setIsLoading(false);
      };

      try {
        // 1. Fetch OAuth URL from backend
        const res = await api.get(`/auth/${provider}/url`);
        if (!res.data.success || !res.data.url) {
          throw new Error(`Failed to get ${provider} auth URL`);
        }

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // 2. Open popup with provider's URL directly
        popup = window.open(
          res.data.url,
          `${provider}_oauth_popup`,
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        if (!popup) {
          throw new Error('Popup blocked! Please allow popups for this site to log in.');
        }

        // 3. Listen for postMessage from popup
        messageHandler = (event: MessageEvent) => {
          const origin = event.origin;
          // Security: Validate origin matches or ends with .run.app or is localhost
          if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
            return;
          }

          if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            const { token: receivedToken, user: userSessionData } = event.data.payload || {};
            if (receivedToken && userSessionData) {
              setToken(receivedToken);
              setUser(userSessionData);

              if (rememberMe) {
                localStorage.setItem('token', receivedToken);
                localStorage.setItem('user', JSON.stringify(userSessionData));
              } else {
                sessionStorage.setItem('token', receivedToken);
                sessionStorage.setItem('user', JSON.stringify(userSessionData));
              }

              cleanup();
              resolve();
            } else {
              cleanup();
              reject(new Error('Invalid credentials returned from authentication provider.'));
            }
          } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
            const errorMsg = event.data.payload?.message || 'Authentication failed.';
            cleanup();
            reject(new Error(errorMsg));
          }
        };

        window.addEventListener('message', messageHandler);

        // 4. Poll for popup closure to handle manual cancellation
        pollTimer = setInterval(() => {
          if (popup && popup.closed) {
            cleanup();
            reject(new Error('Login process was cancelled by the user.'));
          }
        }, 1000);

      } catch (err: any) {
        cleanup();
        reject(err);
      }
    });
  };

  const register = async (fullName: string, email: string, passwordStr: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { 
        fullName, 
        email, 
        password: passwordStr 
      });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    try {
      const res = await api.put('/auth/profile', newData);
      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);

        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        throw new Error(res.data.message || 'Profile update failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Profile update failed';
      throw new Error(errMsg);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      socialLogin,
      logout, 
      updateUser,
      isAuthenticated, 
      loading: isLoading,
      isLoading 
    }}>
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

