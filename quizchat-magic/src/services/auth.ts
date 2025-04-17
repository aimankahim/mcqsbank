import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface AuthResponse {
  access: string;
  refresh: string;
}

interface ErrorResponse {
  error: string;
}

interface ApiRoot {
  quizzes: string;
  questions: string;
  flashcards: string;
  notes: string;
}

export const authService = {
  async getApiRoot(): Promise<ApiRoot> {
    try {
      const response = await axios.get<ApiRoot>(API_CONFIG.baseURL);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch API root:', error);
      throw new Error('Failed to connect to the server');
    }
  },

  async checkUsername(username: string): Promise<boolean> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_CONFIG.baseURL}/api/check-username/`,
        { username }
      );
      return response.status === 200;
    } catch (error: any) {
      if (error.response?.status === 400) {
        return false;
      }
      throw new Error(error.response?.data?.error || 'An error occurred');
    }
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Attempting login with:', { identifier, password });
      
      if (!password) {
        throw new Error('Password is required');
      }

      // First try to get username from email if it looks like an email
      let username = identifier;
      if (identifier.includes('@')) {
        try {
          console.log('Email detected, fetching username...');
          const response = await axios.post<{ username: string }>(
            `${API_CONFIG.baseURL}/api/get-username/`,
            { email: identifier }
          );
          username = response.data.username;
          console.log('Got username:', username);
        } catch (error) {
          console.error('Failed to get username from email:', error);
          throw new Error('Invalid email or username');
        }
      }

      console.log('Attempting login with username:', username);
      const response = await axios.post<AuthResponse>(
        `${API_CONFIG.baseURL}/api/token/`,
        { username, password }
      );
      
      console.log('Login successful, storing tokens');
      // Store tokens
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });

      if (error.response?.data) {
        const errorData = error.response.data;
        if (Array.isArray(errorData.username)) {
          throw new Error(errorData.username[0]);
        } else if (Array.isArray(errorData.password)) {
          throw new Error(errorData.password[0]);
        } else if (errorData.detail) {
          throw new Error(errorData.detail);
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else if (typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
            .join('\n');
          throw new Error(messages);
        }
      }
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  },

  async register(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_CONFIG.baseURL}/api/register/`,
        { username, password }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  async refreshToken(): Promise<string> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      this.logout();
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<{ access: string }>(
        `${API_CONFIG.baseURL}/api/token/refresh/`,
        { refresh }
      );
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        return response.data.access;
      }
      throw new Error('Failed to refresh token');
    } catch (error: any) {
      this.logout();
      throw new Error('Session expired. Please login again.');
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const refresh = localStorage.getItem('refresh_token');
    return !!(token && refresh);
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      console.log('Requesting password reset for:', email);
      await axios.post(
        `${API_CONFIG.baseURL}/api/password-reset/`,
        { email }
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to request password reset');
    }
  }
};

// Add error handling interceptor
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Extract the error message from Django's response
            const djangoError = error.response.data;
            let errorMessage = '';
            
            if (error.response.status === 401) {
                // Handle authentication errors
                if (error.config.url?.includes('/token/')) {
                    errorMessage = 'Username or password is incorrect';
                } else {
                    errorMessage = 'Authentication failed. Please login again.';
                }
            } else if (typeof djangoError === 'object') {
                // Handle Django's error format which might be nested
                const messages: string[] = [];
                Object.entries(djangoError).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        messages.push(`${key}: ${value.join(', ')}`);
                    } else {
                        messages.push(`${key}: ${value}`);
                    }
                });
                errorMessage = messages.join('\n');
            } else {
                errorMessage = String(djangoError);
            }
            
            error.message = errorMessage.trim();
            console.error('API Error:', { 
                status: error.response.status, 
                message: errorMessage,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response?.data
            });
        }
        return Promise.reject(error);
    }
);

// Axios interceptor for automatic token refresh
axios.interceptors.request.use(
    config => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding token to request:', config.url);
        }
        return config;
    },
    error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('Received 401, attempting token refresh');
            originalRequest._retry = true;

            try {
                const newToken = await authService.refreshToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                console.log('Token refreshed, retrying request');
                return axios(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // If refresh fails, redirect to login
                authService.logout();
                window.location.href = '/login';
                throw refreshError;
            }
        }

        return Promise.reject(error);
    }
); 