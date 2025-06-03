import axios from 'axios';

export const API_BASE_URL = 'https://django-based-mcq-app.onrender.com';

export const API_ENDPOINTS = {
  FORGOT_PASSWORD: `${API_BASE_URL}/api/forgot-password/`,
  VERIFY_OTP: `${API_BASE_URL}/api/verify-otp/`,
  RESET_PASSWORD: `${API_BASE_URL}/api/reset-password/`,
  YOUTUBE_QUIZ: `${API_BASE_URL}/api/youtube/quiz/`,
  YOUTUBE_FLASHCARDS: `${API_BASE_URL}/api/youtube/flashcards/`,
  YOUTUBE_NOTES: `${API_BASE_URL}/api/youtube/notes/`,
  YOUTUBE_CHAT: `${API_BASE_URL}/api/youtube/chat/`,
  // Add other endpoints as needed
};

// API Response Types
export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOTPResponse {
  token: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface YouTubeResponse {
  id: string;
  title: string;
  content: any;
}

export const API_CONFIG = {
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true
};

// Create an axios instance with the default config
export const api = axios.create(API_CONFIG);

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 
