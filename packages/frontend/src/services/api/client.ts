import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../../store';
import { clearAuth, refreshAccessToken } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/uiSlice';

class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Try to get token from Redux store first, then from localStorage
        const state = store.getState();
        let token = state.auth.accessToken;
        
        if (!token && typeof window !== 'undefined') {
          token = localStorage.getItem('accessToken');
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const state = store.getState();
            let refreshToken = state.auth.refreshToken;
            
            if (!refreshToken && typeof window !== 'undefined') {
              refreshToken = localStorage.getItem('refreshToken');
            }

            if (refreshToken) {
              const result = await store.dispatch(refreshAccessToken(refreshToken));
              
              if (refreshAccessToken.fulfilled.match(result)) {
                const newToken = result.payload.tokens.accessToken;
                this.processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            store.dispatch(clearAuth());
            store.dispatch(addToast({
              type: 'error',
              title: 'Session Expired',
              message: 'Please log in again',
            }));
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        if (error.response?.data?.error) {
          const errorData = error.response.data.error;
          
          // Don't show toast for validation errors (they're handled by forms)
          if (error.response.status !== 400) {
            store.dispatch(addToast({
              type: 'error',
              title: 'Error',
              message: errorData.message || 'An error occurred',
            }));
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Upload file
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

export const apiClient = new APIClient();
export default apiClient;