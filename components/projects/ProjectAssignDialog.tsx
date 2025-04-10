// app/components/projects/ProjectAssignDialog.tsx
import { useState, useEffect } from 'react';
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
import { Profile } from '@/lib/supabase';

interface ProjectAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentDesignerId: string | null;
  designers: Profile[];
  onAssignDesigner: (designerId: string) => Promise<void>;
  isAssigning: boolean;
}

export function ProjectAssignDialog({
  isOpen,
  onClose,
  currentDesignerId,
  designers,
  onAssignDesigner,
  isAssigning,
}: ProjectAssignDialogProps) {
  const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(currentDesignerId);

  useEffect(() => {
    setSelectedDesignerId(currentDesignerId);
  }, [currentDesignerId, isOpen]);

  const handleSubmit = async () => {
    if (selectedDesignerId) {
      await onAssignDesigner(selectedDesignerId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Diseñador</DialogTitle>
          <DialogDescription>
            Selecciona un diseñador para asignar a este proyecto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select
            value={selectedDesignerId || ''}
            onValueChange={setSelectedDesignerId}
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
            disabled={isAssigning || selectedDesignerId === currentDesignerId || !selectedDesignerId}
          >
            {isAssigning ? 'Asignando...' : 'Asignar Diseñador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}