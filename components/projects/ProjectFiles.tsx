import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectFile } from '@/lib/supabase';

interface ProjectFilesProps {
  files: ProjectFile[];
  canUpload: boolean;
  onDownloadFile: (file: ProjectFile) => void;
  onUploadFiles: (e: React.FormEvent) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function ProjectFiles({
  files,
  canUpload,
  onDownloadFile,
  onUploadFiles,
  isUploading,
  uploadProgress,
}: ProjectFilesProps) {
  const [newFiles, setNewFiles] = useState<FileList | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivos del Proyecto</CardTitle>
        <CardDescription>
          Archivos adjuntos y recursos relacionados con este proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No hay archivos disponibles para este proyecto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-xs">{file.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('es')}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDownloadFile(file)}
                >
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {canUpload && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (newFiles) {
              onUploadFiles(e);
            }
          }} className="mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="newFiles">Subir nuevos archivos</Label>
                <Input
                  id="newFiles"
                  type="file"
                  multiple
                  className="mt-1 cursor-pointer"
                  onChange={(e) => setNewFiles(e.target.files)}
                  disabled={isUploading}
                />
              </div>
              
              {isUploading && uploadProgress > 0 && (
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
              
              <Button 
                type="submit" 
                disabled={!newFiles || newFiles.length === 0 || isUploading}
              >
                {isUploading ? 'Subiendo...' : 'Subir Archivos'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}