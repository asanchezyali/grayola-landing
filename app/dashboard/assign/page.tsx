'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers/supabase-auth-provider';
import { supabase, Project, Profile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/app/providers/toast-provider";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

// Tipos extendidos para trabajar con los datos
type ExtendedProject = Project & {
  client_name: string;
  designer_name?: string;
};

export default function AdminAssignPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // Estados para proyectos y diseñadores
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ExtendedProject[]>([]);
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Estados para la asignación
  const [assignmentInProgress, setAssignmentInProgress] = useState<Record<string, boolean>>({});
  const [selectedDesigners, setSelectedDesigners] = useState<Record<string, string>>({});

  // Verificar si el usuario es project manager
  useEffect(() => {
    if (profile && profile.role !== 'project_manager') {
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Cargar proyectos y diseñadores
  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // 1. Cargar proyectos
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            client:client_id(id, full_name),
            designer:designer_id(id, full_name)
          `)
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        
        // Procesar datos de proyectos
        const processedProjects: ExtendedProject[] = projectsData.map(project => ({
          ...project,
          client_name: project.client?.full_name || 'Usuario desconocido',
          designer_name: project.designer?.full_name
        }));
        
        setProjects(processedProjects);
        
        // 2. Cargar diseñadores
        const { data: designersData, error: designersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'designer')
          .order('full_name', { ascending: true });
        
        if (designersError) throw designersError;
        
        setDesigners(designersData || []);
        
        // Inicializar estados de asignación
        const initialSelectedDesigners: Record<string, string> = {};
        processedProjects.forEach(project => {
          if (project.designer_id) {
            initialSelectedDesigners[project.id] = project.designer_id;
          }
        });
        
        setSelectedDesigners(initialSelectedDesigners);
        
      } catch (error: Error | unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al cargar datos. Por favor intenta nuevamente.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [profile]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let filtered = [...projects];
    
    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(term) || 
        project.client_name.toLowerCase().includes(term) ||
        (project.designer_name && project.designer_name.toLowerCase().includes(term))
      );
    }
    
    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  // Función para asignar diseñador
  const handleAssignDesigner = async (projectId: string) => {
    const designerId = selectedDesigners[projectId];
    
    if (!designerId) {
      showToast("Por favor selecciona un diseñador para asignar", "error");
      return;
    }
    
    // Marcar asignación en progreso
    setAssignmentInProgress(prev => ({ ...prev, [projectId]: true }));
    
    try {
      // Obtener el proyecto actual
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado");
      
      // Actualizar el estado del proyecto si está pendiente
      const newStatus = project.status === 'pending' ? 'in_progress' : project.status;
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ 
          designer_id: designerId,
          status: newStatus
        })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Buscar el diseñador asignado
      const designer = designers.find(d => d.id === designerId);
      const designerName = designer ? designer.full_name : 'Diseñador desconocido';
      
      // Actualizar estado local
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            designer_id: designerId,
            designer_name: designerName,
            status: newStatus
          };
        }
        return p;
      }));
      
      showToast("Diseñador asignado correctamente", "success");
      
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al asignar diseñador. Por favor intenta nuevamente.";

      showToast(
        `Error al asignar diseñador: ${errorMessage}`,
        "error"
      );
    } finally {
      // Finalizar asignación en progreso
      setAssignmentInProgress(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Función para desasignar diseñador
  const handleUnassignDesigner = async (projectId: string) => {
    // Marcar asignación en progreso
    setAssignmentInProgress(prev => ({ ...prev, [projectId]: true }));
    
    try {
      // Obtener el proyecto actual
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado");
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ 
          designer_id: null,
          status: 'pending'
        })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Actualizar estado local
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            designer_id: null,
            designer_name: undefined,
            status: 'pending'
          };
        }
        return p;
      }));
      
      // Eliminar del estado de selección
      const updatedSelections = { ...selectedDesigners };
      delete updatedSelections[projectId];
      setSelectedDesigners(updatedSelections);
      
      showToast("Diseñador desasignado correctamente", "success");
      
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al desasignar diseñador. Por favor intenta nuevamente.";
      showToast(
        `Error al desasignar diseñador: ${errorMessage}`,
        "error"
      );
    } finally {
      // Finalizar asignación en progreso
      setAssignmentInProgress(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es');
  };

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'project_manager') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Solo los project managers pueden acceder a esta página.</p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="mt-4"
            >
              Volver al dashboard
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
          <h1 className="text-2xl font-bold tracking-tight">Asignación de Proyectos</h1>
          <p className="text-gray-500">
            Asigna diseñadores a proyectos pendientes y gestiona asignaciones existentes
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busca y filtra proyectos
          </CardDescription>
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
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
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

      {error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p className="text-red-500">Error al cargar datos: {error}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-4">
              <p className="text-gray-500">No se encontraron proyectos con los filtros seleccionados.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Cliente: {project.client_name} | Creado: {formatDate(project.created_at)}
                    </CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <ProjectStatusBadge status={project.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del proyecto */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Descripción del proyecto</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {project.description || "Sin descripción disponible."}
                    </p>
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${project.id}`}>
                          Ver detalles del proyecto
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Asignación de diseñador */}
                  <div className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                    <h3 className="text-sm font-semibold mb-2">
                      {project.designer_id ? 'Diseñador asignado' : 'Asignar diseñador'}
                    </h3>
                    
                    {project.designer_id ? (
                      <div className="flex items-center space-x-2 mb-4">
                        <Avatar className="h-8 w-8">
                          {project.designer_name ? (
                            <AvatarFallback>{getInitials(project.designer_name)}</AvatarFallback>
                          ) : (
                            <AvatarFallback>??</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-gray-700">{project.designer_name}</span>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm mb-4">Este proyecto no tiene un diseñador asignado.</p>
                    )}
                    
                    <div className="flex flex-col space-y-3">
                      <Select
                        value={selectedDesigners[project.id] || ''}
                        onValueChange={(value) => {
                          setSelectedDesigners(prev => ({
                            ...prev,
                            [project.id]: value
                          }));
                        }}
                        disabled={assignmentInProgress[project.id]}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar diseñador" />
                        </SelectTrigger>
                        <SelectContent>
                          {designers.map((designer) => (
                            <SelectItem key={designer.id} value={designer.id}>
                              {designer.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssignDesigner(project.id)}
                          disabled={
                            assignmentInProgress[project.id] || 
                            !selectedDesigners[project.id] || 
                            selectedDesigners[project.id] === project.designer_id
                          }
                          className="flex-1"
                        >
                          {assignmentInProgress[project.id] ? (
                            <span>Asignando...</span>
                          ) : project.designer_id ? (
                            <span>Cambiar diseñador</span>
                          ) : (
                            <span>Asignar diseñador</span>
                          )}
                        </Button>
                        
                        {project.designer_id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUnassignDesigner(project.id)}
                            disabled={assignmentInProgress[project.id]}
                          >
                            {assignmentInProgress[project.id] ? (
                              <span>Procesando...</span>
                            ) : (
                              <span>Desasignar</span>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}