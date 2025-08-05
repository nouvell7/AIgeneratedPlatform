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

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_service_platform"
# For development with SQLite: DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# External APIs
TEACHABLE_MACHINE_API_KEY="your-teachable-machine-api-key"
HUGGING_FACE_API_KEY="your-hugging-face-api-key"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
GOOGLE_ADSENSE_CLIENT_ID="your-adsense-client-id"
GOOGLE_ADSENSE_CLIENT_SECRET="your-adsense-client-secret"
GITHUB_TOKEN="your-github-personal-access-token"

# Optional
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
PORT=3001
```

### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"

# OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
NEXT_PUBLIC_GITHUB_CLIENT_ID="your-github-client-id"

# External Services
NEXT_PUBLIC_CLOUDFLARE_PAGES_URL="https://your-project.pages.dev"
NEXT_PUBLIC_TEACHABLE_MACHINE_URL="https://teachablemachine.withgoogle.com"

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID="your-google-analytics-id"
NEXT_PUBLIC_NODE_ENV="development"
```