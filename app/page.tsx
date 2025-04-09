'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/supabase-auth-provider';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && !isLoading) {
      router.push('/dashboard');
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-800">
                Grayola
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Iniciar sesión
              </Link>
              <Button asChild>
                <Link href="/auth/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Gestión de proyectos de diseño simplificada
              </h1>
              <p className="mt-4 text-xl text-gray-600">
                La plataforma que democratiza el acceso a servicios de diseño a través de un modelo de suscripción.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Comenzar ahora</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 h-full w-full rounded-lg flex items-center justify-center">
                <div className="p-8 text-center text-white">
                  <div className="text-6xl font-bold mb-4">Grayola</div>
                  <div className="text-xl">Design as a Service</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Características Principales</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestra plataforma ofrece todas las herramientas necesarias para gestionar eficientemente tus proyectos de diseño.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Gestión de Proyectos</h3>
              <p className="mt-4 text-gray-600">
                Crea, visualiza y administra todos tus proyectos de diseño en un solo lugar, con una interfaz intuitiva y fácil de usar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Comunicación Efectiva</h3>
              <p className="mt-4 text-gray-600">
                Comentarios integrados en cada proyecto que facilitan la comunicación entre clientes y diseñadores en tiempo real.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Gestión de Archivos</h3>
              <p className="mt-4 text-gray-600">
                Sube, descarga y gestiona todos los archivos relacionados con tus proyectos de forma segura y organizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Nuestros Clientes</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Empresas reconocidas confían en Grayola para sus necesidades de diseño.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-center h-32">
              <div className="text-xl font-bold text-gray-700">Frubana</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-center h-32">
              <div className="text-xl font-bold text-gray-700">Rockstart</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-center h-32">
              <div className="text-xl font-bold text-gray-700">Universidad Ean</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-center h-32">
              <div className="text-xl font-bold text-gray-700">Y muchos más...</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">¿Listo para transformar tu proceso de diseño?</h2>
          <p className="mt-4 text-xl max-w-3xl mx-auto opacity-90">
            Únete a Grayola hoy y comienza a gestionar tus proyectos de diseño de manera más eficiente.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Empezar ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Grayola</h3>
              <p className="text-gray-400">
                Democratizando el acceso a servicios de diseño a través de un modelo de suscripción.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Términos de servicio</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Política de privacidad</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">info@grayola.com</li>
                <li className="text-gray-400">+57 300 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Grayola. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}