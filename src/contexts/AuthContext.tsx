import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { Tables } from '../types/supabase';
import { fetchUserProfile, updateProfile } from '../services/actions';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<string> => {
    try {
      // Use centralized action instead of inline fetching
      const { data, error } = await fetchUserProfile(userId);

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error);
        return 'player'; // Return default role
      }
      
      if (data) {
        setProfile(data as any);
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

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Wait for profile to load before showing app
        if (session?.user) {
          const role = await fetchProfile(session.user.id);
          console.log('[AuthContext] Initial role loaded:', role);
        }
      } catch (error) {
        console.error('[AuthContext] Init auth error:', error);
      } finally {
        // Set loading to false after profile is loaded
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change:', event, 'User:', session?.user?.id);
      
      // Set loading true for SIGN_IN events to prevent premature navigation
      if (event === 'SIGNED_IN') {
        console.log('[AuthContext] Sign in detected - setting loading=true');
        setLoading(true);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Wait for profile to load before navigation
      if (session?.user) {
        console.log('[AuthContext] Fetching profile for user:', session.user.id);
        const role = await fetchProfile(session.user.id);
        console.log('[AuthContext] Role loaded:', role);
        
        // Set loading false AFTER profile is fetched
        if (event === 'SIGNED_IN') {
          setLoading(false);
          console.log('[AuthContext] Loading complete - navigation ready');
        }
      } else {
        setProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
          role: role, // Pass role in metadata
        }
      }
    });

    if (!error && data.user) {
      console.log('[AuthContext] User created, now setting up profile with role:', role);
      
      // Wait a bit for the trigger to create the profile (if it exists)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Upsert the profile to ensure role is set correctly
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
          whatsapp_number: phone,
          role: role,
        }, {
          onConflict: 'id'
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
