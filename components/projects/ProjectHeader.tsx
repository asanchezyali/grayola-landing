// app/components/projects/ProjectHeader.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProjectStatusBadge } from './ProjectStatusBadge';

interface ProjectHeaderProps {
  title: string;
  status: string;
  createdAt: string;
  showStatusDialog: () => void;
  showAssignDialog: () => void;
  isProjectManager: boolean;
}

export function ProjectHeader({ 
  title, 
  status, 
  createdAt, 
  showStatusDialog, 
  showAssignDialog, 
  isProjectManager 
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex items-center space-x-2 mt-1">
          <ProjectStatusBadge status={status} />
          <span className="text-sm text-gray-500">
            Creado: {new Date(createdAt).toLocaleDateString('es')}
          </span>
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center space-x-3">
        {isProjectManager && (
          <>
            <Button variant="outline" onClick={showStatusDialog}>Cambiar Estado</Button>
            <Button variant="outline" onClick={showAssignDialog}>Asignar Diseñador</Button>
          </>
        )}
        
        <Button variant="outline" asChild>
          <Link href="/projects">Volver a Proyectos</Link>
        </Button>
      </div>
    </div>
  );
}