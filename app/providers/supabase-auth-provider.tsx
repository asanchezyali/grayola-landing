"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase, Profile, UserRole } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Helper function to fetch user profile - wrapped in useCallback to avoid dependency issues
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

  // Create profile if it doesn't exist
  const createProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Obtenemos los detalles del usuario para extraer metadata
      const { data: userData } = await supabase.auth.getUser();

      if (!userData || !userData.user) return null;

      const metadata = userData.user.user_metadata;

      const profileData = {
        id: userId,
        full_name: metadata?.full_name || userData.user.email?.split("@")[0] || "User",
        role: (metadata?.role || "client") as UserRole,
        avatar_url: null,
      };

      const { data, error } = await supabase.from("profiles").insert(profileData).select().single();

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

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        // Obtener la sesión actual
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          setSession(session);
          setUser(session.user);

          // Fetch user profile
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Configurar listener para cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);

      if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch user profile
        const profileData = await fetchProfile(session.user.id);
        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      // Refresh necesario para actualizar la UI
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchProfile]); // Added fetchProfile to dependency array

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      console.log("Iniciando registro de usuario:", { email, fullName, role });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) throw error;

      console.log("Usuario creado exitosamente:", data.user?.id);

      if (data.user) {
        // Crear perfil solo si el usuario fue creado exitosamente
        const profileData = await createProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log("Intentando iniciar sesión para:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Inicio de sesión exitoso para:", email);

      // Actualizar inmediatamente el estado para evitar problemas de sincronización
      if (data.session) {
        setSession(data.session);
        setUser(data.user);

        // Cargar perfil de usuario
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Limpiar estado
      setSession(null);
      setUser(null);
      setProfile(null);

      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    fetchProfile
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