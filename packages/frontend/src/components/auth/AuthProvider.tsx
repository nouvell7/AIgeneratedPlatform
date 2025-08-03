import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { checkAuth } from '../../store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check authentication status when the app loads
    if (typeof window !== 'undefined') {
      dispatch(checkAuth());
    }
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;