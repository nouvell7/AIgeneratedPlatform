import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../store';
import { login, logout, register, clearError } from '../store/slices/authSlice';
import { authApi } from '../services/api/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      if (result.success) {
        router.push('/dashboard');
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (userData: {
    email: string;
    username: string;
    password: string;
  }) => {
    try {
      const result = await dispatch(register(userData)).unwrap();
      if (result.success) {
        router.push('/dashboard');
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const checkAuthStatus = async () => {
    try {
      const profile = await authApi.getProfile();
      return profile.success;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: clearAuthError,
    checkAuthStatus,
  };
};