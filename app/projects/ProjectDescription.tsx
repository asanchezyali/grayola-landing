// app/components/projects/ProjectDescription.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectDescriptionProps {
  description: string | null;
}

export function ProjectDescription({ description }: ProjectDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Descripción del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">{description || 'No hay descripción disponible.'}</p>
      </CardContent>
    </Card>
  );
}