import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import React from 'react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, width, height, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, width, height, ...rest });
  },
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Global test utilities
(global as any).mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user' as const,
  settings: {
    notifications: { email: true, push: true },
    privacy: { profilePublic: true, projectsPublic: true },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

(global as any).mockProject = {
  id: 'test-project-id',
  userId: 'test-user-id',
  name: 'Test Project',
  description: 'Test Description',
  category: 'test',
  status: 'draft' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});