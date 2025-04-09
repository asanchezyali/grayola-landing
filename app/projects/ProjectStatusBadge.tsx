import { Badge } from '@/components/ui/badge';

interface ProjectStatusBadgeProps {
  status: string;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En progreso</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}