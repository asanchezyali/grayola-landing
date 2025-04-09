'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/supabase-auth-provider';
import { supabase, Project, ProjectFile, Profile, ProjectComment } from '@/app/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { ProjectHeader } from '@/app/components/projects/ProjectHeader';
import { ProjectDescription } from '@/app/components/projects/ProjectDescription';
import { ProjectFiles } from '@/app/components/projects/ProjectFiles';
import { ProjectComments } from '@/app/components/projects/ProjectComments';
import { ProjectSidebar } from '@/app/components/projects/ProjectSidebar';
import { ProjectStatusDialog } from '@/app/components/projects/ProjectStatusDialog';
import { ProjectAssignDialog } from '@/app/components/projects/ProjectAssignDialog';

interface ProjectDetailsProps {
  params: { id: string };
}

export default function ProjectDetailsPage({ params }: ProjectDetailsProps) {
  const { id } = params;
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [designer, setDesigner] = useState<Profile | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [comments, setComments] = useState<(ProjectComment & { user_name?: string, user_avatar?: string })[]>([]);
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigningDesigner, setIsAssigningDesigner] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setIsLoading(true);
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        
        if (projectError) throw projectError;
        
        setProject(projectData);
        
        const { data: clientData, error: clientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', projectData.client_id)
          .single();
        
        if (clientError) throw clientError;
        
        setClient(clientData);
        
        if (projectData.designer_id) {
          const { data: designerData, error: designerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', projectData.designer_id)
            .single();
          
          if (!designerError) {
            setDesigner(designerData);
          }
        }
        
        const { data: filesData, error: filesError } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
        
        if (filesError) throw filesError;
        
        setFiles(filesData || []);
        
        const { data: commentsData, error: commentsError } = await supabase
          .from('project_comments')
          .select(`
            *,
            users:user_id(full_name, avatar_url)
          `)
          .eq('project_id', id)
          .order('created_at', { ascending: true });
        
        if (commentsError) throw commentsError;
        
        const processedComments = commentsData.map((comment: any) => ({
          ...comment,
          user_name: comment.users?.full_name,
          user_avatar: comment.users?.avatar_url
        }));
        
        setComments(processedComments);
        
        if (profile?.role === 'project_manager') {
          const { data: designersData, error: designersError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'designer')
            .order('full_name', { ascending: true });
          
          if (!designersError) {
            setDesigners(designersData || []);
          }
        }
        
      } catch (error: any) {
        console.error('Error fetching project details:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (profile) {
      fetchProjectDetails();
    }
  }, [id, profile]);
  
  const getFileUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('project-files')
      .createSignedUrl(filePath, 60); // 60 seconds expiry
    
    if (error) {
      toast({
        title: 'Error',
        description: `No se pudo generar el enlace de descarga: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }
    
    return data.signedUrl;
  };
  
  const handleDownloadFile = async (file: ProjectFile) => {
    const url = await getFileUrl(file.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };
  
  const handleAddComment = async (content: string) => {
    if (!profile || !content.trim()) return;
    
    setIsSubmittingComment(true);
    
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: id,
          user_id: profile.id,
          content: content.trim(),
        })
        .select(`
          *,
          users:user_id(full_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      const newCommentObj = {
        ...data,
        user_name: data.users?.full_name,
        user_avatar: data.users?.avatar_url
      };
      
      setComments([...comments, newCommentObj]);
      
      toast({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido añadido correctamente',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo añadir el comentario: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus: string) => {
    if (!profile || !project) return;
    
    if (profile.role !== 'project_manager') {
      toast({
        title: 'Permiso denegado',
        description: 'Solo los project managers pueden cambiar el estado del proyecto',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUpdatingStatus(true);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setProject({ ...project, status: newStatus });
      
      toast({
        title: 'Estado actualizado',
        description: 'El estado del proyecto ha sido actualizado exitosamente',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo actualizar el estado: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleAssignDesigner = async (designerId: string) => {
    if (!profile || !project) return;
    
    if (profile.role !== 'project_manager') {
      toast({
        title: 'Permiso denegado',
        description: 'Solo los project managers pueden asignar diseñadores',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAssigningDesigner(true);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          designer_id: designerId,
          status: project.status === 'pending' ? 'in_progress' : project.status
        })
        .eq('id', id);
      
      if (error) throw error;
      
      const { data: designerData, error: designerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', designerId)
        .single();
      
      if (designerError) throw designerError;
      
      setDesigner(designerData);
      setProject({ 
        ...project, 
        designer_id: designerId,
        status: project.status === 'pending' ? 'in_progress' : project.status
      });
      
      toast({
        title: 'Diseñador asignado',
        description: `El diseñador ha sido asignado exitosamente al proyecto`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo asignar el diseñador: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsAssigningDesigner(false);
    }
  };
  
  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const formFiles = formData.get('newFiles') as File | null;
    
    if (!profile || !formFiles) return;
    
    const fileList = formFiles instanceof FileList ? formFiles : new FileList();
    
    if (fileList.length === 0) return;
    
    setIsUploadingFiles(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = fileList.length;
      let uploadedFiles = 0;
      const newFileRecords: ProjectFile[] = [];
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const filePath = `${id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);
        
        if (uploadError) throw new Error(`Error al subir el archivo ${file.name}: ${uploadError.message}`);
        
        const { data: fileRecord, error: fileRecordError } = await supabase
          .from('project_files')
          .insert({
            project_id: id,
            file_name: fileName,
            file_type: file.type,
            file_size: file.size,
            file_path: filePath,
            uploaded_by: profile.id,
          })
          .select()
          .single();
        
        if (fileRecordError) throw new Error(`Error al registrar el archivo: ${fileRecordError.message}`);
        
        newFileRecords.push(fileRecord);
        
        uploadedFiles++;
        setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100));
      }
      
      setFiles([...newFileRecords, ...files]);
      
      toast({
        title: 'Archivos subidos',
        description: `${newFileRecords.length} archivos subidos exitosamente`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingFiles(false);
      setUploadProgress(0);
    }
  };
  
  const canUploadFiles = () => {
    if (!profile || !project) return false;
    
    return (
      profile.role === 'client' && project.client_id === profile.id ||
      profile.role === 'designer' && project.designer_id === profile.id
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando detalles del proyecto...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              Volver a proyectos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!project || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Proyecto no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>El proyecto que estás buscando no existe o no tienes permisos para verlo.</p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              Volver a proyectos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <ProjectHeader 
        title={project.title}
        status={project.status}
        createdAt={project.created_at}
        showStatusDialog={() => setStatusDialogOpen(true)}
        showAssignDialog={() => setAssignDialogOpen(true)}
        isProjectManager={profile.role === 'project_manager'}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectDescription description={project.description} />
          
          <ProjectFiles 
            files={files}
            canUpload={canUploadFiles()}
            onDownloadFile={handleDownloadFile}
            onUploadFiles={handleUploadFiles}
            isUploading={isUploadingFiles}
            uploadProgress={uploadProgress}
          />
          
          <ProjectComments 
            comments={comments}
            onAddComment={handleAddComment}
            isSubmitting={isSubmittingComment}
          />
        </div>
        
        <div>
          <ProjectSidebar 
            status={project.status}
            client={client}
            designer={designer}
            createdAt={project.created_at}
            updatedAt={project.updated_at}
          />
        </div>
      </div>
      
      <ProjectStatusDialog 
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        currentStatus={project.status}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />
      
      <ProjectAssignDialog 
        isOpen={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        currentDesignerId={project.designer_id}
        designers={designers}
        onAssignDesigner={handleAssignDesigner}
        isAssigning={isAssigningDesigner}
      />
    </div>
  );
}