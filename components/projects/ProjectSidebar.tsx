// app/components/projects/ProjectSidebar.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { Profile } from '@/lib/supabase';

interface ProjectSidebarProps {
  status: string;
  client: Profile | null;
  designer: Profile | null;
  createdAt: string;
  updatedAt: string;
}

export function ProjectSidebar({
  status,
  client,
  designer,
  createdAt,
  updatedAt,
}: ProjectSidebarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Estado</h3>
            <div className="mt-1">
              <ProjectStatusBadge status={status} />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
            <div className="mt-1 flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                {client?.avatar_url ? (
                  <AvatarImage src={client.avatar_url} alt={client?.full_name} />
                ) : (
                  <AvatarFallback>{getInitials(client?.full_name || '')}</AvatarFallback>
                )}
              </Avatar>
              <span>{client?.full_name}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Diseñador</h3>
            <div className="mt-1">
              {designer ? (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    {designer.avatar_url ? (
                      <AvatarImage src={designer.avatar_url} alt={designer.full_name} />
                    ) : (
                      <AvatarFallback>{getInitials(designer.full_name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span>{designer.full_name}</span>
                </div>
              ) : (
                <span className="text-gray-400">Sin asignar</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Fechas</h3>
            <div className="mt-1 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creado:</span>
                <span>{new Date(createdAt).toLocaleDateString('es')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actualizado:</span>
                <span>{new Date(updatedAt).toLocaleDateString('es')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}