import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import authRoutes from '../../routes/auth.routes';
import { AuthService } from '../../services/auth.service';

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyToken: jest.fn(),
  refreshToken: jest.fn(),
} as jest.Mocked<AuthService>;

// Override container resolution
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
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email: validUserData.email,
            username: validUserData.username,
            role: 'USER',
          },
          token: 'mock-jwt-token',
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
      expect(response.body.data.token).toBe('mock-jwt-token');
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

    it('중복된 이메일로 409 에러 반환', async () => {
      // Given
      const mockError = {
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: '이미 존재하는 이메일입니다',
        },
      };

      mockAuthService.register.mockResolvedValue(mockError);

      // When
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Then
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('유효한 자격증명으로 로그인 성공', async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email: validLoginData.email,
            username: 'testuser',
            role: 'USER',
          },
          token: 'mock-jwt-token',
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
      expect(response.body.data.token).toBe('mock-jwt-token');
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('잘못된 자격증명으로 401 에러 반환', async () => {
      // Given
      const mockError = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
      };

      mockAuthService.login.mockResolvedValue(mockError);

      // When
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      // Then
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
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

  describe('GET /api/auth/profile', () => {
    it('유효한 토큰으로 프로필 조회 성공', async () => {
      // Given
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      const mockResponse = {
        success: true,
        data: { user: mockUser },
      };

      mockAuthService.verifyToken.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-jwt-token');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
    });

    it('토큰 없이 요청 시 401 에러 반환', async () => {
      // When
      const response = await request(app).get('/api/auth/profile');

      // Then
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('잘못된 토큰으로 401 에러 반환', async () => {
      // Given
      const mockError = {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 토큰입니다',
        },
      };

      mockAuthService.verifyToken.mockResolvedValue(mockError);

      // When
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      // Then
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('유효한 리프레시 토큰으로 토큰 갱신 성공', async () => {
      // Given
      const refreshToken = 'valid-refresh-token';
      const mockResponse = {
        success: true,
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('new-access-token');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('잘못된 리프레시 토큰으로 401 에러 반환', async () => {
      // Given
      const invalidRefreshToken = 'invalid-refresh-token';
      const mockError = {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: '유효하지 않은 리프레시 토큰입니다',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockError);

      // When
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: invalidRefreshToken });

      // Then
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });
});