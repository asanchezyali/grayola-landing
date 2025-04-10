// app/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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

      {/* Features and other sections omitted for brevity */}

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
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">
                    Registrarse
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Política de privacidad
                  </Link>
                </li>
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
