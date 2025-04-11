"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/supabase-auth-provider";
import { supabase, Project } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { useToast } from "@/app/providers/toast-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProjectWithNames = Project & {
  client_name: string;
  designer_name?: string;
};

export default function AdminProjectsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<ProjectWithNames[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithNames[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [projectToDelete, setProjectToDelete] = useState<ProjectWithNames | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== "project_manager") {
      router.push("/dashboard");
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:client_id(id, full_name),
            designer:designer_id(id, full_name)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const processedData = data.map((project) => ({
          ...project,
          client_name: project.client?.full_name || "Usuario desconocido",
          designer_name: project.designer?.full_name,
        }));

        setProjects(processedData);
        setFilteredProjects(processedData);
      } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error message:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (profile) {
      fetchProjects();
    }
  }, [profile, router]);

  useEffect(() => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(term) ||
          project.client_name.toLowerCase().includes(term) ||
          (project.designer_name && project.designer_name.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);

    try {
      const { data: projectFiles, error: filesError } = await supabase
        .from("project_files")
        .select("file_path")
        .eq("project_id", projectToDelete.id);

      if (filesError) throw filesError;

      if (projectFiles && projectFiles.length > 0) {
        const filePaths = projectFiles.map((file) => file.file_path);

        const { error: storageError } = await supabase.storage.from("project-files").remove(filePaths);

        if (storageError) {
          console.error("Error al eliminar archivos del storage:", storageError);
        }
      }

      const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectToDelete.id);

      if (deleteError) throw deleteError;

      setProjects(projects.filter((p) => p.id !== projectToDelete.id));

      showToast("El proyecto ha sido eliminado correctamente", "success");
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`No se pudo eliminar el proyecto: ${errorMessage}`, "error");
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es");
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administración de Proyectos</h1>
          <p className="text-gray-500">Gestiona todos los proyectos de diseño</p>
        </div>
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
                placeholder="Buscar por título, cliente o diseñador"
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
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p className="text-red-500">Error al cargar proyectos: {error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Diseñador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No se encontraron proyectos con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium truncate max-w-xs">{project.title}</TableCell>
                      <TableCell>{project.client_name}</TableCell>
                      <TableCell>
                        {project.designer_name || <span className="text-gray-400">Sin asignar</span>}
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>{formatDate(project.created_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projects/${project.id}`}>Ver</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/projects/${project.id}/edit`}>Editar</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setProjectToDelete(project)}>
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el proyecto <strong>{projectToDelete?.title}</strong>?
              <br />
              <br />
              Esta acción es irreversible y eliminará todos los archivos y comentarios asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
