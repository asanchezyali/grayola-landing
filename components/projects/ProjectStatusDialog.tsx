import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Definir un tipo para los estados posibles
type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface ProjectStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: ProjectStatus;
  onUpdateStatus: (newStatus: ProjectStatus) => Promise<void>;
  isUpdating: boolean;
}

export function ProjectStatusDialog({
  isOpen,
  onClose,
  currentStatus,
  onUpdateStatus,
  isUpdating,
}: ProjectStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<ProjectStatus>(currentStatus);

  const handleSubmit = async () => {
    await onUpdateStatus(newStatus);
    onClose();
  };

  // Para manejar el cambio de valor del Select, necesitamos asegurarnos
  // de que el valor sea del tipo correcto
  const handleValueChange = (value: string) => {
    // Validar que el valor sea uno de los estados permitidos
    if (value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'cancelled') {
      setNewStatus(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Estado del Proyecto</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado para este proyecto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select
            value={newStatus}
            onValueChange={handleValueChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isUpdating || newStatus === currentStatus}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}