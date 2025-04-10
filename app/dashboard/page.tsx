// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../providers/supabase-auth-provider";
import { supabase, Project } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { profile, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificación adicional de autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          console.log("No hay sesión activa en Dashboard, redirigiendo a login");
          window.location.href = "/auth/login";
          return;
        }

        console.log("Sesión verificada en Dashboard:", data.session.user.email);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Error verificando autenticación en Dashboard:", error);
        window.location.href = "/auth/login";
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (isCheckingAuth || !profile) return;

      try {
        setIsLoadingProjects(true);
        console.log("Cargando proyectos para el usuario:", profile.id);

        let query = supabase.from("projects").select("*");

        // Filter projects based on user role
        if (profile.role === "client") {
          query = query.eq("client_id", profile.id);
        } else if (profile.role === "designer") {
          query = query.eq("designer_id", profile.id);
        }

        // Limit to 5 most recent projects for the dashboard
        query = query.order("created_at", { ascending: false }).limit(5);

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        console.log("Proyectos cargados:", data?.length || 0);
        setProjects((data as Project[]) || []);
      } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error al cargar proyectos";
        setError(errorMessage);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [profile, isCheckingAuth]);

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendiente
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En progreso
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completado
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Error de autenticación</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.</p>
            <Button onClick={() => (window.location.href = "/auth/login")} className="mt-4">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenido, {profile.full_name}</h1>
          <p className="text-gray-500">Aquí puede ver un resumen de sus proyectos y actividades recientes.</p>
        </div>
        {profile.role === "client" && (
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/dashboard/projects/new">Nuevo Proyecto</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Proyectos Recientes</CardTitle>
            <CardDescription>Los {projects.length} proyectos más recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">Error al cargar proyectos: {error}</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No hay proyectos disponibles.</p>
                {profile.role === "client" && (
                  <Button variant="outline" asChild className="mt-2">
                    <Link href="/dashboard/projects/new">Crear nuevo proyecto</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <Link href={`/dashboard/projects/${project.id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {project.description || "Sin descripción"}
                          </p>
                        </div>
                        <div>{getStatusBadge(project.status)}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Creado: {new Date(project.created_at).toLocaleDateString("es")}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/projects">Ver todos los proyectos</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
            <CardDescription>Estado actual de tus proyectos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">Error al cargar datos: {error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700 font-medium">Total de proyectos</span>
                  <span className="font-bold text-lg">{projects.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">Pendientes</span>
                  <span className="font-bold text-lg">{projects.filter((p) => p.status === "pending").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">En progreso</span>
                  <span className="font-bold text-lg">{projects.filter((p) => p.status === "in_progress").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Completados</span>
                  <span className="font-bold text-lg">{projects.filter((p) => p.status === "completed").length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {profile.role === "project_manager" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>Herramientas para gestionar proyectos y usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild className="h-auto py-6 flex flex-col justify-center">
                <Link href="/dashboard/gestion">
                  <span className="text-lg font-medium mb-1">Gestionar Proyectos</span>
                  <span className="text-sm text-gray-500">Ver y editar todos los proyectos</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-6 flex flex-col justify-center">
                <Link href="/dashboard/users">
                  <span className="text-lg font-medium mb-1">Gestionar Usuarios</span>
                  <span className="text-sm text-gray-500">Administrar diseñadores y clientes</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-6 flex flex-col justify-center">
                <Link href="/dashboard/assign">
                  <span className="text-lg font-medium mb-1">Asignar Proyectos</span>
                  <span className="text-sm text-gray-500">Asignar diseñadores a proyectos</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
