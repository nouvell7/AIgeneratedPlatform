# Project Structure & Organization

## Monorepo Layout
```
ai-service-platform/
├── packages/
│   ├── frontend/          # Next.js React application
│   ├── backend/           # Express.js API server
│   └── shared/            # Common types and utilities
├── .kiro/                 # Kiro specs and steering documents
├── docs/                  # Project documentation
└── docker-compose.yml     # Development environment
```

## Frontend Structure (`packages/frontend/`)
```
src/
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   ├── auth/             # Authentication components
│   ├── projects/         # Project-specific components
│   ├── deployment/       # Deployment-related components
│   ├── revenue/          # Revenue/monetization components
│   ├── community/        # Community forum components
│   ├── templates/        # Template browser components
│   ├── ai/               # AI model components
│   └── layout/           # Layout components (header, sidebar, footer)
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication logic
│   ├── useProjects.ts    # Project management logic
│   ├── useTemplates.ts   # Template browsing logic
│   ├── useRevenue.ts     # Revenue optimization logic
│   ├── useCommunity.ts   # Community interaction logic
│   └── index.ts          # Hook exports
├── pages/                # Next.js pages (file-based routing)
│   ├── auth/             # Authentication pages
│   ├── projects/         # Project management pages
│   ├── admin.tsx         # Admin dashboard
│   ├── community.tsx     # Community forum
│   ├── revenue.tsx       # Revenue dashboard
│   ├── settings.tsx      # User settings
│   ├── success-stories.tsx # Success stories
│   ├── templates.tsx     # Template browser
│   └── [id]/             # Dynamic routes
├── services/             # API service layer
│   └── api/              # API client functions
│       ├── auth.ts       # Authentication API
│       ├── projects.ts   # Project management API
│       ├── templates.ts  # Template API
│       ├── community.ts  # Community API
│       ├── revenue.ts    # Revenue API
│       ├── user.ts       # User management API
│       ├── codespaces.ts # Codespace API
│       ├── deployment.ts # Deployment API
│       └── index.ts      # API exports
├── store/                # Redux store configuration
│   └── slices/           # Redux slices
├── lib/                  # Utility functions and configurations
│   ├── utils.ts          # General utilities
│   ├── constants.ts      # Application constants
│   ├── formatters.ts     # Data formatting utilities
│   ├── validators.ts     # Validation functions
│   ├── schemas.ts        # Zod validation schemas
│   └── index.ts          # Utility exports
├── types/                # TypeScript type definitions
└── styles/               # Global styles and Tailwind config
```

## Backend Structure (`packages/backend/`)
```
src/
├── controllers/          # HTTP request handlers
│   ├── auth.controller.ts        # Authentication
│   ├── project.controller.ts     # Project management
│   ├── template.controller.ts    # Template management
│   ├── user.controller.ts        # User management
│   ├── community.controller.ts   # Community features
│   ├── revenue.controller.ts     # Revenue optimization
│   ├── codespaces.controller.ts  # Codespace management
│   ├── aiModel.controller.ts     # AI model integration
│   ├── successStory.controller.ts # Success stories
│   └── userSettings.controller.ts # User settings
├── services/             # Business logic layer
│   ├── auth.service.ts           # Authentication logic
│   ├── project.service.ts        # Project business logic
│   ├── template.service.ts       # Template logic
│   ├── user.service.ts           # User management logic
│   ├── community.service.ts      # Community logic
│   ├── revenue.service.ts        # Revenue logic
│   ├── codespaces.service.ts     # Codespace logic
│   ├── aiModel.service.ts        # AI model logic
│   ├── successStory.service.ts   # Success story logic
│   └── userSettings.service.ts   # User settings logic
├── routes/               # API route definitions
│   ├── auth.routes.ts            # Authentication routes
│   ├── project.routes.ts         # Project routes
│   ├── template.routes.ts        # Template routes
│   ├── user.routes.ts            # User routes
│   ├── community.routes.ts       # Community routes
│   ├── revenue.routes.ts         # Revenue routes
│   ├── codespaces.routes.ts      # Codespace routes
│   ├── aiModel.routes.ts         # AI model routes
│   └── successStory.routes.ts    # Success story routes
├── middleware/           # Express middleware
├── lib/                  # External service clients
├── utils/                # Utility functions
└── index.ts              # Application entry point
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Database seeding
```

## Shared Package (`packages/shared/`)
```
src/
├── types.ts              # Common TypeScript interfaces
├── schemas.ts            # Zod validation schemas
├── constants.ts          # Application constants
└── i18n/                 # Internationalization
```

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `CreateProjectModal.tsx`)
- **Pages**: kebab-case (e.g., `success-stories.tsx`)
- **Services**: camelCase with suffix (e.g., `auth.service.ts`)
- **Controllers**: camelCase with suffix (e.g., `project.controller.ts`)
- **Types**: camelCase interfaces (e.g., `interface ProjectConfig`)

### Code Conventions
- **React Components**: PascalCase function components with TypeScript
- **API Routes**: RESTful naming (`/api/projects/:id`)
- **Database Models**: PascalCase with descriptive names
- **Environment Variables**: SCREAMING_SNAKE_CASE

## Architecture Patterns

### Frontend
- **Component Composition**: Small, reusable components with clear props
- **Container/Presentational**: Separate data fetching from UI rendering
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Redux Slices**: Feature-based state organization

### Backend
- **Controller-Service Pattern**: Controllers handle HTTP, services contain business logic
- **Dependency Injection**: Use TSyringe for service dependencies
- **Middleware Chain**: Authentication, validation, error handling
- **Repository Pattern**: Database access abstraction via Prisma

## Import Conventions
- Use absolute imports with path mapping (`@/` for src, `@shared/` for shared package)
- Group imports: external libraries, internal modules, relative imports
- Use named exports for utilities, default exports for components/pages