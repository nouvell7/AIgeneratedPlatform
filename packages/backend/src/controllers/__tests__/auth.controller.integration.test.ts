import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import authRoutes from '../../routes/auth.routes';
import { AuthService, AuthResult } from '../../services/auth.service';
import { TokenPair } from '../../utils/jwt';

// Mock AuthService with proper typing
const mockAuthService = {
  register: jest.fn() as jest.MockedFunction<(data: any) => Promise<AuthResult>>,
  login: jest.fn() as jest.MockedFunction<(credentials: any) => Promise<AuthResult>>,
  refreshToken: jest.fn() as jest.MockedFunction<(token: string) => Promise<TokenPair>>,
  getUserProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
  validateUserPermissions: jest.fn(),
} as any;

// Override container resolution
container.clearInstances();
container.registerInstance(AuthService, mockAuthService);

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('유효한 데이터로 회원가입 API 호출 성공', async () => {
      // Given
      const mockResponse: AuthResult = {
        user: {
          id: 'test-user-id',
          email: validUserData.email,
          username: validUserData.username,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: '{}',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.tokens.accessToken).toBe('mock-access-token');
      expect(mockAuthService.register).toHaveBeenCalledWith(validUserData);
    });

    it('필수 필드 누락 시 400 에러 반환', async () => {
      // Given
      const invalidData = {
        email: 'test@example.com',
        // username 누락
        password: 'password123',
      };

      // When
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('잘못된 이메일 형식으로 400 에러 반환', async () => {
      // Given
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      };

      // When
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('유효한 이메일');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('유효한 자격증명으로 로그인 성공', async () => {
      // Given
      const mockResponse: AuthResult = {
        user: {
          id: 'test-user-id',
          email: validLoginData.email,
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: '{}',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validLoginData.email);
      expect(response.body.data.tokens.accessToken).toBe('mock-access-token');
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('필수 필드 누락 시 400 에러 반환', async () => {
      // Given
      const invalidData = {
        email: 'test@example.com',
        // password 누락
      };

      // When
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('유효한 리프레시 토큰으로 토큰 갱신 성공', async () => {
      // Given
      const refreshToken = 'valid-refresh-token';
      const mockResponse: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBe('new-access-token');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });
});