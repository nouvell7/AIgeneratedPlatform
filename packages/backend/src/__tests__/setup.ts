import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    template: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    communityPost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock external APIs
jest.mock('axios');

// Mock Winston logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  loggers: {
    auth: {
      info: jest.fn(),
      error: jest.fn(),
    },
    project: {
      info: jest.fn(),
      error: jest.fn(),
    },
    external: {
      info: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Global test utilities
(global as any).mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

(global as any).mockProject = {
  id: 'test-project-id',
  userId: 'test-user-id',
  name: 'Test Project',
  description: 'Test Description',
  category: 'test',
  status: 'DRAFT',
  projectType: 'LOW_CODE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'file:./test.db';