import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../useAuth';
import authSlice from '../../store/slices/authSlice';
import { authApi } from '../../services/api/auth';

// Mock API
jest.mock('../../services/api/auth');
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        ...initialState,
      },
    },
  });
};

// Wrapper component for testing hooks with Redux
const createWrapper = (store: any) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('로그인 성공 시 사용자 정보 설정 및 대시보드로 이동', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      const mockResponse = {
        success: true,
        data: {
          user: global.mockUser,
          token: 'mock-token',
        },
      };

      mockAuthApi.login = jest.fn().mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Then
      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(result.current.user).toEqual(global.mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('로그인 실패 시 에러 상태 설정', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      const mockError = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
      };

      mockAuthApi.login = jest.fn().mockResolvedValue(mockError);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      // Then
      expect(result.current.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다');
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('로그인 중 로딩 상태 관리', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthApi.login = jest.fn().mockReturnValue(loginPromise);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      // Then - 로딩 중
      expect(result.current.isLoading).toBe(true);

      // When - 로그인 완료
      await act(async () => {
        resolveLogin!({
          success: true,
          data: { user: global.mockUser, token: 'mock-token' },
        });
        await loginPromise;
      });

      // Then - 로딩 완료
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('회원가입 성공 시 사용자 정보 설정 및 대시보드로 이동', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      const mockResponse = {
        success: true,
        data: {
          user: global.mockUser,
          token: 'mock-token',
        },
      };

      mockAuthApi.register = jest.fn().mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register(userData);
      });

      // Then
      expect(mockAuthApi.register).toHaveBeenCalledWith(userData);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(result.current.user).toEqual(global.mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('회원가입 실패 시 에러 상태 설정', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };
      const mockError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '비밀번호는 최소 6자 이상이어야 합니다',
        },
      };

      mockAuthApi.register = jest.fn().mockResolvedValue(mockError);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register(userData);
        } catch (error) {
          // Expected to throw
        }
      });

      // Then
      expect(result.current.error).toBe('비밀번호는 최소 6자 이상이어야 합니다');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 사용자 정보 초기화 및 홈으로 이동', async () => {
      // Given
      const store = createTestStore({
        user: global.mockUser,
        isAuthenticated: true,
      });
      const wrapper = createWrapper(store);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Then
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('clearError', () => {
    it('에러 상태 초기화', () => {
      // Given
      const store = createTestStore({
        error: 'Some error message',
      });
      const wrapper = createWrapper(store);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.clearError();
      });

      // Then
      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAuthStatus', () => {
    it('유효한 토큰으로 인증 상태 확인 성공', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);
      const mockResponse = {
        success: true,
        data: { user: global.mockUser },
      };

      mockAuthApi.getProfile = jest.fn().mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      const authStatus = await act(async () => {
        return await result.current.checkAuthStatus();
      });

      // Then
      expect(mockAuthApi.getProfile).toHaveBeenCalled();
      expect(authStatus).toBe(true);
    });

    it('유효하지 않은 토큰으로 인증 상태 확인 실패', async () => {
      // Given
      const store = createTestStore();
      const wrapper = createWrapper(store);

      mockAuthApi.getProfile = jest.fn().mockRejectedValue(new Error('Unauthorized'));

      // When
      const { result } = renderHook(() => useAuth(), { wrapper });

      const authStatus = await act(async () => {
        return await result.current.checkAuthStatus();
      });

      // Then
      expect(authStatus).toBe(false);
    });
  });
});