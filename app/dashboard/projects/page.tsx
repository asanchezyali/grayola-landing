"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../providers/supabase-auth-provider";
import { supabase, Project } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProjectsPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<(Project & { client_name?: string; designer_name?: string })[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    (Project & { client_name?: string; designer_name?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);

        let query = supabase.from("projects").select(`
          *,
          clients:client_id(full_name),
          designers:designer_id(full_name)
        `);

        if (profile?.role === "client") {
          query = query.eq("client_id", profile.id);
        } else if (profile?.role === "designer") {
          query = query.eq("designer_id", profile.id);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const processedData = data.map((project) => {
          return {
            ...project,
            client_name: project.clients?.full_name,
            designer_name: project.designers?.full_name,
          };
        });

        setProjects(processedData);
        setFilteredProjects(processedData);
      } catch (error: Error | unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al cargar proyectos. Por favor intenta nuevamente.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (profile) {
      fetchProjects();
    }
  }, [profile]);

  useEffect(() => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(term) ||
          (project.description && project.description.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-gray-500">Gestiona tus proyectos de diseño</p>
        </div>
        {profile?.role === "client" && (
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/dashboard/projects/new">Nuevo Proyecto</Link>
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra proyectos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título o descripción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-gray-50">
              <CardContent className="p-6">
                <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p className="text-red-500">Error al cargar proyectos: {error}</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                Intentar nuevamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p className="text-gray-500">No se encontraron proyectos.</p>
              {profile?.role === "client" && (
                <Button variant="outline" asChild className="mt-2">
                  <Link href="/dashboard/projects/new">Crear nuevo proyecto</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-6">
                <Link href={`/dashboard/projects/${project.id}`} className="block">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {project.description || "Sin descripción"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getStatusBadge(project.status)}
                        <span className="text-xs text-gray-500">
                          Creado: {new Date(project.created_at).toLocaleDateString("es")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 space-y-2 text-sm text-right">
                      {profile?.role === "project_manager" && (
                        <>
                          <p>
                            <span className="text-gray-500">Cliente:</span>{" "}
                            <span className="font-medium">{project.client_name || "N/A"}</span>
                          </p>
                          <p>
                            <span className="text-gray-500">Diseñador:</span>{" "}
                            <span className="font-medium">{project.designer_name || "Sin asignar"}</span>
                          </p>
                        </>
                      )}
                      <div className="pt-2">
                        <Button variant="outline" size="sm">
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
