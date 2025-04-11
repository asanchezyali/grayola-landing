# Grayola - Plataforma de Gestión de Proyectos de Diseño

![Grayola Logo](https://grayola.io/wp-content/uploads/2024/05/Grayola-Logo-SVG.svg)

Esta plataforma web permite a Grayola, una startup de Design as a Service, gestionar eficientemente sus proyectos de diseño con una estructura de roles bien definida para clientes, diseñadores y project managers.

## Contenido

- [Grayola - Plataforma de Gestión de Proyectos de Diseño](#grayola---plataforma-de-gestión-de-proyectos-de-diseño)
  - [Contenido](#contenido)
  - [Características](#características)
  - [Tecnologías](#tecnologías)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Requisitos](#requisitos)
  - [Instalación](#instalación)
  - [Configuración](#configuración)
    - [Variables de Entorno](#variables-de-entorno)
    - [Configuración de Supabase](#configuración-de-supabase)
  - [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
    - [Tabla `profiles`](#tabla-profiles)
    - [Tabla `projects`](#tabla-projects)
    - [Tabla `project_files`](#tabla-project_files)
    - [Tabla `project_comments`](#tabla-project_comments)
    - [Row Level Security (RLS)](#row-level-security-rls)
  - [Seguridad](#seguridad)
  - [Guía de Uso](#guía-de-uso)
    - [Roles de Usuario](#roles-de-usuario)
      - [Cliente](#cliente)
      - [Diseñador](#diseñador)
      - [Project Manager](#project-manager)
    - [Flujo de Trabajo Típico](#flujo-de-trabajo-típico)
  - [Implementación](#implementación)
  - [Capturas de Pantalla](#capturas-de-pantalla)
  - [Colaboradores](#colaboradores)

## Características

- **Sistema de autenticación y autorización** con múltiples roles:
  - **Clientes**: Pueden crear nuevos proyectos y ver solo sus propios proyectos
  - **Diseñadores**: Pueden ver solo los proyectos asignados a ellos
  - **Project Managers**: Tienen control total sobre todos los proyectos y usuarios

- **Gestión completa de proyectos (CRUD)**:
  - Creación de proyectos con título, descripción y carga múltiple de archivos
  - Visualización de proyectos según el rol del usuario
  - Edición de proyectos (solo para roles autorizados)
  - Eliminación de proyectos (solo para roles autorizados)

- **Sistema de comentarios** para facilitar la comunicación entre clientes y diseñadores

- **Gestión de archivos** con carga, visualización y descarga segura de archivos

- **Panel administrativo** para project managers con gestión de usuarios y proyectos

- **Interfaz moderna y atractiva** utilizando componentes de ShadCN UI y Tailwind CSS

## Tecnologías

- **Frontend**:
  - Next.js 14 (React)
  - TypeScript
  - Tailwind CSS
  - ShadCN UI (componentes)

- **Backend**:
  - Supabase (PostgreSQL)
  - Supabase Auth (autenticación)
  - Supabase Storage (almacenamiento de archivos)

- **Despliegue**:
  - Vercel (recomendado)

## Estructura del Proyecto

```
grayola-project-management/
├── app/
│   ├── auth/             # Rutas de autenticación
│   ├── components/       # Componentes reutilizables
│   ├── dashboard/        # Dashboard del usuario
│   ├── lib/              # Utilidades y configuración
│   ├── projects/         # Gestión de proyectos
│   ├── providers/        # Providers de contexto
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página de inicio
├── components/           # Componentes UI (ShadCN UI)
├── public/               # Archivos estáticos
├── styles/               # Estilos globales
├── .env.example          # Ejemplo de variables de entorno
├── .env.local            # Variables de entorno locales (no en repositorio)
├── .gitignore            # Configuración de Git
├── next.config.js        # Configuración de Next.js
├── package.json          # Dependencias del proyecto
├── README.md             # Documentación
└── tsconfig.json         # Configuración de TypeScript
```

## Requisitos

- Node.js 18.0 o superior
- npm o yarn
- Cuenta en Supabase

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/grayola-project-management.git
   cd grayola-project-management
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o con yarn
   yarn install
   ```

3. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env.local
   ```

4. Configura las variables de entorno en `.env.local` con tus credenciales de Supabase.

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o con yarn
   yarn dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Configuración

### Variables de Entorno

Configura las siguientes variables en tu archivo `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role

# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Grayola Project Management

# Almacenamiento
NEXT_PUBLIC_STORAGE_BUCKET=project-files
```

### Configuración de Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com/).
2. Ejecuta los scripts SQL proporcionados en `database-schema.sql` en el Editor SQL de Supabase.
3. Configura las políticas de seguridad (RLS) como se indica en la sección de Estructura de Base de Datos.

## Estructura de la Base de Datos

El esquema de la base de datos incluye las siguientes tablas:

### Tabla `profiles`

Extiende la tabla de usuarios predeterminada de Supabase con información adicional:

```sql
CREATE TYPE user_role AS ENUM ('client', 'designer', 'project_manager');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (id)
);
```

### Tabla `projects`

Almacena información sobre los proyectos de diseño:

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  designer_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Tabla `project_files`

Almacena información sobre los archivos asociados a proyectos:

```sql
CREATE TABLE project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Tabla `project_comments`

Almacena comentarios en proyectos:

```sql
CREATE TABLE project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Row Level Security (RLS)

Se han configurado políticas de seguridad a nivel de fila para garantizar que los usuarios solo puedan acceder a los datos que les corresponden según su rol:

- Los clientes solo pueden ver sus propios proyectos
- Los diseñadores solo pueden ver los proyectos asignados a ellos
- Los project managers tienen acceso completo a todos los proyectos

## Seguridad

El sistema implementa varias capas de seguridad:

1. **Autenticación** mediante Supabase Auth
2. **Autorización** basada en roles con políticas RLS en la base de datos
3. **Middleware** de Next.js para proteger rutas según el rol del usuario
4. **Validación** de formularios en el cliente y en el servidor
5. **Storage seguro** con políticas de acceso para archivos

## Guía de Uso

### Roles de Usuario

#### Cliente

- Puede registrarse y crear su cuenta
- Puede crear nuevos proyectos con título, descripción y archivos
- Puede ver solo sus propios proyectos
- Puede añadir comentarios a sus proyectos
- Puede subir archivos adicionales a sus proyectos

#### Diseñador

- Puede ver solo los proyectos asignados
- Puede añadir comentarios a los proyectos asignados
- Puede subir archivos a los proyectos asignados

#### Project Manager

- Tiene acceso completo a todos los proyectos
- Puede asignar diseñadores a proyectos
- Puede cambiar el estado de los proyectos
- Puede gestionar usuarios (cambiar roles)
- Puede eliminar proyectos

### Flujo de Trabajo Típico

1. Un cliente crea un nuevo proyecto
2. Un project manager revisa el proyecto y asigna un diseñador
3. El diseñador trabaja en el proyecto, sube archivos y comenta
4. El cliente y el diseñador colaboran mediante comentarios
5. El project manager actualiza el estado del proyecto según avanza
6. Cuando el proyecto está completo, se marca como "completado"

## Implementación

Para implementar la aplicación en producción:

1. Configura tu proyecto Supabase de producción
2. Ejecuta los scripts SQL en el entorno de producción
3. Implementa la aplicación en Vercel:
   ```bash
   vercel --prod
   ```
4. Configura las variables de entorno en Vercel

## Capturas de Pantalla

![image](https://github.com/user-attachments/assets/0f1c3b6e-5a32-4687-9def-8bc659fcf38a)

![image](https://github.com/user-attachments/assets/6bc46892-b3ef-4995-acec-60c17ed11cfa)

![image](https://github.com/user-attachments/assets/a5b89500-7a1b-46c7-b27c-826c2d086d96)

## Colaboradores

Proyecto desarrollado para Grayola, una startup de Design as a Service.

---

© 2025 Grayola. Todos los derechos reservados.
