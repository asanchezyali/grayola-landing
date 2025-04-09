// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SupabaseAuthProvider } from './providers/supabase-auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Grayola - Gestión de Proyectos de Diseño',
  description: 'Plataforma de gestión de proyectos para Grayola, una startup de Design as a Service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SupabaseAuthProvider>
          {children}
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}