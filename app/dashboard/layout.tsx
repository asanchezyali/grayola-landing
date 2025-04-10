"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Verificar autenticación una sola vez al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      // Esperamos a que finalice la carga de autenticación
      if (!isLoading) {
        if (!user || !profile) {
          console.log("No hay sesión activa, redirigiendo a login");
          router.push("/auth/login");
        } else {
          console.log("Usuario autenticado:", user.email);
        }
        setInitialLoad(false);
      }
    };

    checkAuth();
  }, [user, profile, isLoading, router]);

  // Mostrar estado de carga
  if (isLoading || initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // No renderizar nada mientras redirige
  if (!user || !profile) {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", forRoles: ["client", "designer", "project_manager"] },
    { name: "Mis Proyectos", href: "/dashboard/projects", forRoles: ["client", "designer", "project_manager"] },
    { name: "Nuevo Proyecto", href: "/dashboard/projects/new", forRoles: ["client"] },
    { name: "Todos los Proyectos", href: "/admin/projects", forRoles: ["project_manager"] },
    { name: "Usuarios", href: "/admin/users", forRoles: ["project_manager"] },
  ];

  const filteredNavigation = navigation.filter((item) => item.forRoles.includes(profile.role));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // No necesitamos redirección manual aquí, signOut ya lo hace
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="h-16 flex items-center justify-center border-b">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-800">
            Grayola
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md
                  ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {profile.role === "client" ? "Cliente" : profile.role === "designer" ? "Diseñador" : "Project Manager"}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full">
            <div className="h-16 flex items-center justify-between px-4 border-b">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-800">
                Grayola
              </Link>
              <button onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleMobileMenu}
                    className={`
                      flex items-center px-4 py-2 text-sm font-medium rounded-md
                      ${
                        pathname === item.href
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6">
          <button onClick={toggleMobileMenu} className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 md:ml-4"></div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    ) : (
                      <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Configuración</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
