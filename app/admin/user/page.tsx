// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/supabase-auth-provider';
import { supabase, Profile, UserRole } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/app/providers/toast-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

// Tipo extendido para la información del usuario
type UserWithStats = Profile & { 
  email: string;
  projects_count: number;
};

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Estado para el diálogo de edición de rol
  const [userToEdit, setUserToEdit] = useState<UserWithStats | null>(null);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Verificar si el usuario es project manager
    if (profile && profile.role !== 'project_manager') {
      router.push('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true);

        // Primero obtenemos todos los usuarios de 'profiles'
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        if (!profilesData) {
          setUsers([]);
          setFilteredUsers([]);
          return;
        }

        // Obtener emails de los usuarios
        // (Esto es simplificado, ya que el email podría obtenerse de otra manera)
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

        // Mapa de ID de usuario a email
        const emailMap: Record<string, string> = {};
        if (!usersError && usersData) {
          usersData.users.forEach(user => {
            emailMap[user.id] = user.email || 'Email no disponible';
          });
        }

        // Obtener todos los proyectos para calcular conteos
        const { data: allProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError) {
          console.error('Error al obtener proyectos:', projectsError);
        }

        // Calcular conteos de proyectos por cliente y diseñador
        const projectCounts: Record<string, number> = {};
        
        if (allProjects) {
          // Contar proyectos para clientes
          allProjects.forEach(project => {
            if (project.client_id) {
              projectCounts[project.client_id] = (projectCounts[project.client_id] || 0) + 1;
            }
          });
          
          // Contar proyectos para diseñadores
          allProjects.forEach(project => {
            if (project.designer_id) {
              projectCounts[project.designer_id] = (projectCounts[project.designer_id] || 0) + 1;
            }
          });
        }

        // Combinar toda la información
        const combinedData: UserWithStats[] = profilesData.map(profile => {
          return {
            ...profile,
            email: emailMap[profile.id] || 'Email no disponible',
            projects_count: projectCounts[profile.id] || 0
          };
        });

        setUsers(combinedData);
        setFilteredUsers(combinedData);
      } catch (error) {
        console.error('Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (profile) {
      fetchUsers();
    }
  }, [profile, router]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let filtered = [...users];
    
    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Filtro de rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  // Función para actualizar el rol de un usuario
  const handleUpdateRole = async () => {
    if (!userToEdit || !newRole) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userToEdit.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      setUsers(users.map(user => 
        user.id === userToEdit.id ? { ...user, role: newRole } : user
      ));
      
      showToast(`El rol de ${userToEdit.full_name} ha sido actualizado a ${getRoleName(newRole)}`, 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al actualizar el rol:', errorMessage);
      showToast(`No se pudo actualizar el rol: ${errorMessage}`, 'error');
    } finally {
      setIsUpdating(false);
      setUserToEdit(null);
      setNewRole(null);
    }
  };

  // Obtener nombre del rol
  const getRoleName = (role: string): string => {
    switch (role) {
      case 'client':
        return 'Cliente';
      case 'designer':
        return 'Diseñador';
      case 'project_manager':
        return 'Project Manager';
      default:
        return role;
    }
  };

  // Obtener color del badge según el rol
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'client':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Cliente</Badge>;
      case 'designer':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Diseñador</Badge>;
      case 'project_manager':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Project Manager</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es');
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
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-gray-500">
            Administra todos los usuarios de la plataforma
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busca y filtra usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="designer">Diseñadores</SelectItem>
                  <SelectItem value="project_manager">Project Managers</SelectItem>
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
              <p className="text-red-500">Error al cargar usuarios: {error}</p>
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
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Proyectos</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No se encontraron usuarios con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url} alt={user.full_name} />
                            ) : (
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>{user.projects_count}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setUserToEdit(user);
                            setNewRole(user.role);
                          }}
                        >
                          Cambiar Rol
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

      {/* Diálogo para cambiar rol de usuario */}
      <Dialog 
        open={!!userToEdit} 
        onOpenChange={(open) => {
          if (!open) {
            setUserToEdit(null);
            setNewRole(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Estás cambiando el rol de <strong>{userToEdit?.full_name}</strong>.
              <br /><br />
              El rol actual es <strong>{userToEdit ? getRoleName(userToEdit.role) : ''}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={newRole || ''}
              onValueChange={(value) => setNewRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="designer">Diseñador</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-2 text-sm text-gray-500">
              <p>Ten en cuenta que:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Los clientes pueden crear proyectos y ver solo sus propios proyectos.</li>
                <li>Los diseñadores solo pueden ver los proyectos que les han sido asignados.</li>
                <li>Los project managers tienen acceso completo a todos los proyectos y usuarios.</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUserToEdit(null);
                setNewRole(null);
              }}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleUpdateRole}
              disabled={isUpdating || newRole === userToEdit?.role || !newRole}
            >
              {isUpdating ? 'Actualizando...' : 'Cambiar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}