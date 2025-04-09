// app/components/projects/ProjectComments.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectComment } from '@/app/lib/supabase';

interface ProjectCommentsProps {
  comments: (ProjectComment & { user_name?: string, user_avatar?: string })[];
  onAddComment: (comment: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ProjectComments({
  comments,
  onAddComment,
  isSubmitting,
}: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState('');

  // Get initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await onAddComment(newComment);
    setNewComment('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentarios</CardTitle>
        <CardDescription>
          Discusiones y feedback sobre el proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No hay comentarios aún. Sé el primero en comentar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <Avatar className="h-10 w-10">
                  {comment.user_avatar ? (
                    <AvatarImage src={comment.user_avatar} alt={comment.user_name || 'Usuario'} />
                  ) : (
                    <AvatarFallback>{getInitials(comment.user_name || 'Usuario')}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{comment.user_name || 'Usuario'}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('es')}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Añade un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              required
            />
            <Button 
              type="submit" 
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}