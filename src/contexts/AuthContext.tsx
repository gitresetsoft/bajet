import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to transform Supabase user to app user
const transformSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
  };
};

// Helper function to save session to localStorage
const saveSessionToStorage = (session: Session | null) => {
  if (session) {
    localStorage.setItem('budget_session', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    }));
  } else {
    localStorage.removeItem('budget_session');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        // Check if there's a saved session in localStorage
        const savedSession = localStorage.getItem('budget_session');
        
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            // Verify the session is still valid
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session && !error) {
              setUser(transformSupabaseUser(session.user));
            } else {
              // Session expired or invalid, clear it
              localStorage.removeItem('budget_session');
              setUser(null);
            }
          } catch (parseError) {
            // Invalid session data, clear it
            localStorage.removeItem('budget_session');
            setUser(null);
          }
        } else {
          // No saved session, check Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            setUser(transformSupabaseUser(session.user));
            saveSessionToStorage(session);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(transformSupabaseUser(session.user));
          saveSessionToStorage(session);
        } else {
          setUser(null);
          localStorage.removeItem('budget_session');
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      if (data.session && data.user) {
        setUser(transformSupabaseUser(data.user));
        saveSessionToStorage(data.session);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Unexpected login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // If email confirmation is required, Supabase won't create a session immediately
      // In that case, we need to check if session exists
      if (data.session && data.user) {
        setUser(transformSupabaseUser(data.user));
        saveSessionToStorage(data.session);
        setIsLoading(false);
        return { success: true };
      }

      // User created but needs email confirmation
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      // Clear user state and localStorage
      setUser(null);
      localStorage.removeItem('budget_session');
    } catch (error) {
      console.error('Unexpected logout error:', error);
      // Still clear local state even if there's an error
      setUser(null);
      localStorage.removeItem('budget_session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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