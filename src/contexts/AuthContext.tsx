import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { Tables } from '../types/supabase';
import { fetchUserProfile } from '../services/actions';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, role: 'player' | 'venue_owner') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_INIT_TIMEOUT_MS = 6000;

function roleFromUser(user: User | null): string | null {
  if (!user) return null;
  const metaRole = user.user_metadata?.role;
  if (metaRole === 'venue_owner' || metaRole === 'player') {
    return metaRole;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authReadyRef = useRef(false);

  const setAuthReady = () => {
    authReadyRef.current = true;
    setLoading(false);
  };

  const fetchProfile = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await fetchUserProfile(userId);

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error);
        return 'player';
      }

      if (data) {
        setProfile(data as Profile);
        setUserRole(data.role);
        return data.role;
      }

      return 'player';
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      return 'player';
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const loadProfileDeferred = (userId: string) => {
    // Never call Supabase from inside onAuthStateChange — it can deadlock session restore.
    setTimeout(() => {
      void fetchProfile(userId);
    }, 0);
  };

  const applySession = (nextSession: Session | null) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (nextUser) {
      const fallbackRole = roleFromUser(nextUser);
      if (fallbackRole) {
        setUserRole(fallbackRole);
      }
      loadProfileDeferred(nextUser.id);
    } else {
      setProfile(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    authReadyRef.current = false;
    setLoading(true);

    const finishAuthInit = (timedOut = false) => {
      if (!mounted) return;
      if (timedOut && !authReadyRef.current) {
        console.warn('[AuthContext] Auth init timeout — unblocking app');
      }
      setAuthReady();
    };

    const safetyTimer = setTimeout(() => finishAuthInit(true), AUTH_INIT_TIMEOUT_MS);

    const clearSafetyTimer = () => clearTimeout(safetyTimer);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth event:', event);

      applySession(nextSession);

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        clearSafetyTimer();
        finishAuthInit(false);
      }
    });

    // Fallback if INITIAL_SESSION is delayed (must run outside the auth callback).
    setTimeout(() => {
      if (!mounted || authReadyRef.current) return;

      supabase.auth
        .getSession()
        .then(({ data: { session: storedSession } }) => {
          if (!mounted || authReadyRef.current) return;
          if (storedSession) {
            applySession(storedSession);
          }
          clearSafetyTimer();
          finishAuthInit(false);
        })
        .catch(() => {
          if (!mounted || authReadyRef.current) return;
          clearSafetyTimer();
          finishAuthInit(false);
        });
    }, 0);

    return () => {
      mounted = false;
      clearSafetyTimer();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      applySession(data.session);
      setAuthReady();
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, role: 'player' | 'venue_owner' = 'player') => {
    console.log('[AuthContext] Signing up with role:', role);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
        },
      },
    });

    if (!error && data.user) {
      console.log('[AuthContext] User created, now setting up profile with role:', role);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
          whatsapp_number: phone,
          role: role,
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (profileError) {
        console.error('[AuthContext] Profile upsert error:', profileError);
      } else {
        console.log('[AuthContext] Profile created/updated successfully with role:', profileData?.role);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setUserRole(null);
  };

  const value = {
    session,
    user,
    profile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
