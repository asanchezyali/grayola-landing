'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// Definición del tipo Profile (ajústalo según tu esquema)
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

  // Función para crear un perfil si no existe
  const createProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({ id: userId, full_name: "", role: "user" }) // Ajusta los valores por defecto según tu esquema
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Exception creating profile:", error);
      return null;
    }
  };

  // Función para obtener el perfil
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Si el perfil no existe, intentamos crearlo
        if (error.code === "PGRST116") {
          return await createProfile(userId);
        }
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Exception fetching profile:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error);
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          console.log("Initial session:", session);
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user?.id) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      console.log("Sign up response:", data);
      if (error) throw error;
      // Crear perfil después del registro
      if (data.user?.id) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Sign up error:", err);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in response:", data);
      if (error) throw error;
      // Obtener perfil después de iniciar sesión
      if (data.user?.id) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setProfile(null);
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
      throw err;
    }
  };

  const value = {
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
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}