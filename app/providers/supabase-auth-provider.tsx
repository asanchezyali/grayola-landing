'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Definición del tipo Profile
type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  updated_at?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Crear perfil si no existe
  const createProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Creating profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: userId, full_name: '', role: 'user' })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error.message, error.code, error.details);
        return null;
      }
      console.log('Profile created successfully:', data);
      return data as Profile;
    } catch (error) {
      console.error('Exception creating profile:', error);
      return null;
    }
  }, []);

  // Obtener perfil
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        console.log('Fetching profile for user:', userId);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

        if (error) {
          console.error('Error fetching profile:', error.message, error.code, error.details);
          if (error.code === 'PGRST116') {
            console.log('Profile not found, attempting to create one...');
            return await createProfile(userId);
          }
          return null;
        }
        console.log('Profile fetched successfully:', data);
        return data as Profile;
      } catch (error) {
        console.error('Exception fetching profile:', error);
        return null;
      }
    },
    [createProfile]
  );

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        setIsLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log('Initial session fetched:', session);
        if (error) {
          console.error('Error fetching initial session:', error.message, error.code);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.id) {
              console.log('Fetching profile during initialization for user:', session.user.id);
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            } else {
              setProfile(null);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios en el estado de autenticación
    console.log('Setting up auth state listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.id) {
          console.log('Fetching profile on auth state change for user:', session.user.id);
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to /');
          router.push('/');
        }
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, fetchProfile]);

  // Registro
  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      console.log('Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      console.log('Sign up response:', data);
      if (error) throw new Error(error.message);
      if (data.user?.id) {
        console.log('Fetching profile after sign up for user:', data.user.id);
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  };

  // Inicio de sesión
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Sign in response:', data);
      if (error) throw new Error(error.message);
      if (data.user?.id) {        
        console.log('Fetching profile after sign in for user:', data.user.id);
        const profileData = await fetchProfile(data.user.id);
        console.log('Profile data after sign in:', profileData);
        setProfile(profileData);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  // Cierre de sesión
  const signOut = async () => {
    try {
      console.log('Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      setUser(null);
      setSession(null);
      setProfile(null);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}