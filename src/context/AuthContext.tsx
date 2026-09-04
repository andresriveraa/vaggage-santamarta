import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Linking} from 'react-native';
import type {Session, User} from '@supabase/supabase-js';
import {supabase} from '../services/supabaseClient';
import { AppLang } from '../constants/lang';

const REDIRECT_URL = 'vaggage://auth/callback';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  lang: AppLang,
  setLang: (e: AppLang) => void;
  toggleLang: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<AppLang>('es');

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const exchangeUrlForSession = (url: string) => {
      if (!url.startsWith(REDIRECT_URL)) {
        return;
      }
      const code = new URL(url).searchParams.get('code');
      if (!code) {
        console.log('OAuth redirect missing code param:', url);
        return;
      }
      supabase.auth.exchangeCodeForSession(code).then(({error}) => {
        if (error) {
          console.log('Error exchanging OAuth code for session:', error);
        }
      });
    };

    Linking.getInitialURL().then(url => {
      if (url) {
        exchangeUrlForSession(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({url}) =>
      exchangeUrlForSession(url),
    );
    return () => subscription.remove();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const {data, error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: REDIRECT_URL, skipBrowserRedirect: true},
    });
    if (error) {
      throw error;
    }
    if (data?.url) {
      await Linking.openURL(data.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const toggleLang = useCallback(() => {
      setLang(l => l === 'es' ? 'en' : 'es');
  }, [setLang]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signInWithGoogle,
        signOut,
        lang,
        setLang,
        toggleLang,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
