import axios from 'axios';

const API_URL = 'https://django-based-mcq-app.onrender.com/api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user?: {
        username: string;
        email: string;
    };
}

class AuthService {
    // Store username after registration for login
    private static storedUsername: string | null = null;

    async checkUsername(username: string): Promise<boolean> {
        try {
            const response = await axios.post(`${API_URL}/check-username/`, {
                username: username
            });
            return response.data.exists;
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        console.log('Login attempt with:', { email: credentials.email });
        let username = AuthService.storedUsername;
        
        // If we don't have a stored username, try to get it from email
        if (!username) {
            try {
                console.log('Fetching username for email:', credentials.email);
                // First try to get the username using email
                const response = await axios.post(`${API_URL}/get-username/`, {
                    email: credentials.email
                });
                username = response.data.username;
                console.log('Username fetched:', username);
            } catch (error) {
                console.log('Failed to fetch username, using email local part');
                // If that fails, use the email's local part as username
                username = credentials.email.split('@')[0];
            }
        }

        try {
            console.log('Attempting login with username:', username);
            const response = await axios.post(`${API_URL}/token/`, {
                username: username,
                password: credentials.password,
            });

            console.log('Login response received:', { success: !!response.data.access });
            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                // Store the username in localStorage for future logins
                localStorage.setItem('username', username);
                console.log('Tokens stored in localStorage');
            }
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                throw new Error('Username or password is incorrect');
            }
            throw error;
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        // Create a username from the name (lowercase, no spaces)
        const username = data.name.toLowerCase().replace(/\s+/g, '');
        console.log('Registration attempt with username:', username);
        
        try {
            // First check if username exists
            const checkResponse = await axios.post(`${API_URL}/check-username/`, {
                username: username
            });
            
            if (checkResponse.data.exists) {
                throw new Error(`Username "${username}" is already taken. Please try a different name.`);
            }
            
            const response = await axios.post(`${API_URL}/register/`, {
                username: username,
                email: data.email,
                password: data.password,
            });
            
            console.log('Registration response received:', { success: !!response.data.access });
            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                // Store the username for subsequent login
                localStorage.setItem('username', username);
                AuthService.storedUsername = username;
                console.log('Registration successful, tokens stored');
            }
            return response.data;
        } catch (error: any) {
            console.error('Registration error:', error.response?.data || error.message);
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const errorMessages = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(errorData);
            }
            throw error;
        }
    }

    logout(): void {
        console.log('Logging out, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        AuthService.storedUsername = null;
    }

    getToken(): string | null {
        const token = localStorage.getItem('token');
        console.log('Getting token:', { exists: !!token });
        return token;
    }

    async refreshToken(): Promise<string> {
        console.log('Attempting to refresh token');
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
            console.log('No refresh token found');
            this.logout();
            throw new Error('No refresh token available');
        }

        try {
            console.log('Making refresh token request');
            const response = await axios.post(`${API_URL}/token/refresh/`, {
                refresh,
            });

            console.log('Refresh token response received:', { success: !!response.data.access });
            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                return response.data.access;
            }
            throw new Error('Failed to refresh token');
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw new Error('Session expired. Please login again.');
        }
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const refresh = localStorage.getItem('refresh_token');
        const isAuth = !!(token && refresh);
        console.log('Checking authentication:', { isAuth, hasToken: !!token, hasRefresh: !!refresh });
        return isAuth;
    }
}

export const authService = new AuthService();

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
            console.error('API Error:', { status: error.response.status, message: errorMessage });
        }
        return Promise.reject(error);
    }
);

// Axios interceptor for automatic token refresh
axios.interceptors.request.use(
    async (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding token to request:', config.url);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
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
