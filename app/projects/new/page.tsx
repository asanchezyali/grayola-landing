// app/projects/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/supabase-auth-provider';
import { supabase } from '@/app/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

export default function NewProjectPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      setError('Debes iniciar sesión para crear un proyecto');
      return;
    }
    
    if (profile.role !== 'client') {
      setError('Solo los clientes pueden crear nuevos proyectos');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // 1. Create the project record
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          client_id: profile.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (projectError) {
        throw new Error(`Error al crear el proyecto: ${projectError.message}`);
      }
      
      if (!project) {
        throw new Error('No se pudo crear el proyecto');
      }
      
      // 2. Upload files if any
      if (files && files.length > 0) {
        const totalFiles = files.length;
        let uploadedFiles = 0;
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Create a unique file path
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const filePath = `${project.id}/${fileName}`;
          
          // Upload the file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);
          
          if (uploadError) {
            throw new Error(`Error al subir el archivo ${file.name}: ${uploadError.message}`);
          }
          
          // Create file record in project_files table
          const { error: fileRecordError } = await supabase
            .from('project_files')
            .insert({
              project_id: project.id,
              file_name: fileName,
              file_type: file.type,
              file_size: file.size,
              file_path: filePath,
              uploaded_by: profile.id,
            });
          
          if (fileRecordError) {
            throw new Error(`Error al registrar el archivo: ${fileRecordError.message}`);
          }
          
          // Update progress
          uploadedFiles++;
          setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100));
        }
      }
      
      // Show success message
      toast({
        title: "Proyecto creado con éxito",
        description: "Tu proyecto ha sido creado y está pendiente de asignación a un diseñador.",
      });
      
      // Redirect to the project details page
      router.push(`/projects/${project.id}`);
      
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
        <p className="text-gray-500">
          Completa el formulario para solicitar un nuevo proyecto de diseño
        </p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalles del Proyecto</CardTitle>
            <CardDescription>
              Proporciona un título claro y una descripción detallada para ayudar a nuestros diseñadores a entender tus necesidades.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Título del Proyecto *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Rediseño de Logotipo para Empresa XYZ"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Proyecto *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los objetivos, requisitos y cualquier detalle importante para el diseño..."
                rows={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="files">Archivos de Referencia (opcional)</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes subir múltiples archivos como logos actuales, guías de marca, ejemplos, etc.
              </p>
            </div>
            
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Subiendo archivos: {uploadProgress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando proyecto...' : 'Crear Proyecto'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}