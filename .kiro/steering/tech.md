# Technology Stack & Build System

## Architecture
Monorepo structure using npm workspaces with three main packages:
- `packages/frontend` - Next.js React application
- `packages/backend` - Express.js API server
- `packages/shared` - Common types and utilities

## Frontend Stack
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom component library with Radix UI primitives
- **Charts**: Recharts for analytics dashboards

## Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma with code-first schema
- **Authentication**: JWT + OAuth 2.0 (Google, GitHub)
- **Dependency Injection**: TSyringe with reflect-metadata
- **Logging**: Winston with structured logging

## Development Tools
- **Package Manager**: npm with workspaces
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier (configured via .prettierrc)
- **Testing**: Jest with ts-jest
- **Dev Server**: tsx for backend, Next.js dev for frontend

## Common Commands

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only (port 3000)
npm run dev:backend      # Backend only (port 3001)
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with test data
```

### Build & Deploy
```bash
npm run build           # Build all packages
npm run start           # Start production server
npm run lint            # Lint all packages
npm run test            # Run all tests
```

## External Services
- **AI Models**: Teachable Machine, Hugging Face APIs
- **Authentication**: Google OAuth, GitHub OAuth
- **Deployment**: Cloudflare Pages
- **Development**: GitHub Codespaces
- **Monetization**: Google AdSense API

## Environment Variables
Backend requires `.env` file with database URL, JWT secrets, and OAuth credentials.
Frontend requires `.env.local` with API endpoints and public keys.