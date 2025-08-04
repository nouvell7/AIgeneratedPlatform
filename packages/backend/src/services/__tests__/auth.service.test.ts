import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

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
        ...global.mockUser,
        ...validUserData,
        passwordHash: hashedPassword,
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
      mockBcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      mockPrisma.user.create = jest.fn().mockResolvedValue(mockUser);
      mockJwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // When
      const result = await authService.register(validUserData);

      // Then
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validUserData.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validUserData.email,
          username: validUserData.username,
          passwordHash: hashedPassword,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(expect.objectContaining({
        email: validUserData.email,
        username: validUserData.username,
      }));
      expect(result.data.token).toBe('mock-jwt-token');
    });

    it('중복된 이메일로 회원가입 실패', async () => {
      // Given
      const existingUser = global.mockUser;
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(existingUser);

      // When
      const result = await authService.register(validUserData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_ALREADY_EXISTS');
      expect(result.error?.message).toBe('이미 존재하는 이메일입니다');
    });

    it('잘못된 이메일 형식으로 회원가입 실패', async () => {
      // Given
      const invalidUserData = {
        ...validUserData,
        email: 'invalid-email',
      };

      // When
      const result = await authService.register(invalidUserData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('유효한 이메일');
    });

    it('약한 비밀번호로 회원가입 실패', async () => {
      // Given
      const weakPasswordData = {
        ...validUserData,
        password: '123',
      };

      // When
      const result = await authService.register(weakPasswordData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('비밀번호는 최소 6자');
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('올바른 자격증명으로 로그인 성공', async () => {
      // Given
      const mockUser = {
        ...global.mockUser,
        passwordHash: 'hashed-password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockJwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // When
      const result = await authService.login(loginData);

      // Then
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.passwordHash
      );
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(expect.objectContaining({
        email: mockUser.email,
        username: mockUser.username,
      }));
      expect(result.data.token).toBe('mock-jwt-token');
    });

    it('존재하지 않는 이메일로 로그인 실패', async () => {
      // Given
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // When
      const result = await authService.login(loginData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
      expect(result.error?.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      // Given
      const mockUser = {
        ...global.mockUser,
        passwordHash: 'hashed-password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(false);

      // When
      const result = await authService.login(loginData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
      expect(result.error?.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다');
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰 검증 성공', async () => {
      // Given
      const token = 'valid-jwt-token';
      const decodedPayload = { userId: 'test-user-id' };
      const mockUser = global.mockUser;

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // When
      const result = await authService.verifyToken(token);

      // Then
      expect(mockJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: decodedPayload.userId },
      });
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
    });

    it('잘못된 토큰으로 검증 실패', async () => {
      // Given
      const invalidToken = 'invalid-token';
      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // When
      const result = await authService.verifyToken(invalidToken);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TOKEN');
    });

    it('만료된 토큰으로 검증 실패', async () => {
      // Given
      const expiredToken = 'expired-token';
      mockJwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // When
      const result = await authService.verifyToken(expiredToken);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
    });
  });
});