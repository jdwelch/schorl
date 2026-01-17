import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSessionFromToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Only initialize auth on client side (not during SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Dev helper: log session token for multi-device testing
      if (__DEV__ && session?.access_token && Platform.OS === 'web') {
        console.log('🔑 Dev auth token:', session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [mounted]);

  // Handle deep link for magic link auth callback
  useEffect(() => {
    if (!mounted || Platform.OS === 'web') return;

    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url) {
        // Extract token from URL and create session
        const parsed = Linking.parse(url);
        if (parsed.path === 'auth/callback' && parsed.queryParams) {
          // Supabase will handle the token automatically via the auth listener
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened from magic link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [mounted]);

  const signInWithEmail = async (email: string) => {
    // Detect if running in Expo Go
    const isExpoGo = Platform.OS !== 'web' &&
                     typeof __DEV__ !== 'undefined' &&
                     __DEV__ &&
                     !require('expo-constants').default.appOwnership;

    let redirectUrl: string;

    if (Platform.OS === 'web') {
      redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:8081/auth/callback';
    } else if (isExpoGo) {
      // For Expo Go, we need to use the exp:// scheme
      // User will need to manually paste the link or use web for now
      redirectUrl = 'mdtasks://auth/callback'; // Fallback
      console.warn('⚠️ Magic links may not work in Expo Go. Please test on web or use a development build.');
    } else {
      // Production or development build
      redirectUrl = 'mdtasks://auth/callback';
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const setSessionFromToken = async (accessToken: string) => {
    try {
      // Parse the token if it's a JSON object
      let token = accessToken;
      try {
        const parsed = JSON.parse(accessToken);
        token = parsed.access_token || accessToken;
      } catch {
        // Not JSON, use as-is
      }

      // Set the session using the token
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // Use same token for refresh
      });

      if (error) {
        throw error;
      }

      if (__DEV__) {
        console.log('✅ Session set from token');
      }
    } catch (error) {
      console.error('Failed to set session from token:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithEmail,
        signOut,
        setSessionFromToken,
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