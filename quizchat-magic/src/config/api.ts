import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://django-based-mcq-app.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
  REGISTER: `${API_BASE_URL}/api/auth/register/`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/auth/token/refresh/`,
  QUIZZES: `${API_BASE_URL}/api/quizzes/`,
  QUESTIONS: `${API_BASE_URL}/api/questions/`,
  FLASHCARDS: `${API_BASE_URL}/api/flashcards/`,
  NOTES: `${API_BASE_URL}/api/notes/`,
  PDFS: `${API_BASE_URL}/api/pdfs/`,
  PDF_UPLOAD: `${API_BASE_URL}/api/pdfs/upload/`,
  PDF_PROCESS: `${API_BASE_URL}/api/pdfs/process/`,
  PDF_CHAT: `${API_BASE_URL}/api/pdfs/chat/`,
  PDF_HISTORY: `${API_BASE_URL}/api/pdfs/history/`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/forgot-password/`,
  VERIFY_OTP: `${API_BASE_URL}/api/verify-otp/`,
  RESET_PASSWORD: `${API_BASE_URL}/api/reset-password/`,
};

export interface QuizResponse {
  id: number;
  title: string;
  description: string;
  created_at: string;
  questions: QuestionResponse[];
}

export interface QuestionResponse {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
}

export interface FlashcardResponse {
  id: number;
  front: string;
  back: string;
  created_at: string;
}

export interface NoteResponse {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface PDFResponse {
  id: number;
  title: string;
  file: string;
  created_at: string;
  processed: boolean;
}

export interface ChatMessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

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
