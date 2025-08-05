import 'reflect-metadata';
import { AuthService } from '../auth.service';
import { ValidationError, ConflictError, AuthenticationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password', () => ({
  PasswordService: {
    validatePasswordStrength: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));

jest.mock('../../utils/jwt', () => ({
  JWTService: {
    generateTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  loggers: {
    auth: {
      userRegistered: jest.fn(),
      userLoggedIn: jest.fn(),
      tokenRefreshed: jest.fn(),
    },
  },
}));

const mockPrisma = require('../../lib/prisma').prisma;
const mockPassword = require('../../utils/password').PasswordService;
const mockJwt = require('../../utils/jwt').JWTService;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('유효한 사용자 정보로 회원가입 성공', async () => {
      // Given
      const hashedPassword = 'hashed-password';
      const mockUser = {
        id: 'user-123',
        email: validUserData.email,
        username: validUserData.username,
        passwordHash: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPassword.validatePasswordStrength.mockReturnValue({ 
        isValid: true, 
        score: 4, 
        errors: [] 
      });
      mockPassword.hashPassword.mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.generateTokenPair.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      // When
      const result = await authService.register(validUserData);

      // Then
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    });

    it('이미 존재하는 이메일로 회원가입 실패', async () => {
      // Given
      const existingUser = {
        id: 'existing-user',
        email: validUserData.email,
      };
      mockPassword.validatePasswordStrength.mockReturnValue({ 
        isValid: true, 
        score: 4, 
        errors: [] 
      });
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      // When & Then
      await expect(authService.register(validUserData))
        .rejects.toThrow(ConflictError);
    });

    it('약한 비밀번호로 회원가입 실패', async () => {
      // Given
      const weakPasswordData = {
        ...validUserData,
        password: '123',
      };
      mockPassword.validatePasswordStrength.mockReturnValue({ 
        isValid: false, 
        score: 1, 
        errors: ['Password too short'] 
      });

      // When & Then
      await expect(authService.register(weakPasswordData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('올바른 자격증명으로 로그인 성공', async () => {
      // Given
      const mockUser = {
        id: 'user-123',
        email: loginCredentials.email,
        username: 'testuser',
        passwordHash: 'hashed-password',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPassword.verifyPassword.mockResolvedValue(true);
      mockJwt.generateTokenPair.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      // When
      const result = await authService.login(loginCredentials);

      // Then
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    });

    it('존재하지 않는 이메일로 로그인 실패', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(authService.login(loginCredentials))
        .rejects.toThrow(AuthenticationError);
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      // Given
      const mockUser = {
        id: 'user-123',
        email: loginCredentials.email,
        passwordHash: 'hashed-password',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPassword.verifyPassword.mockResolvedValue(false);

      // When & Then
      await expect(authService.login(loginCredentials))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('refreshToken', () => {
    it('유효한 리프레시 토큰으로 토큰 갱신 성공', async () => {
      // Given
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { userId: 'user-123' };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockJwt.verifyRefreshToken.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.generateTokenPair.mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // When
      const result = await authService.refreshToken(refreshToken);

      // Then
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('잘못된 리프레시 토큰으로 갱신 실패', async () => {
      // Given
      const invalidRefreshToken = 'invalid-refresh-token';
      mockJwt.verifyRefreshToken.mockImplementation(() => {
        throw new AuthenticationError('Invalid refresh token');
      });

      // When & Then
      await expect(authService.refreshToken(invalidRefreshToken))
        .rejects.toThrow(AuthenticationError);
    });
  });
});