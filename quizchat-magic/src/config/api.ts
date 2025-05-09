import axios from 'axios';

export const API_BASE_URL = 'https://django-based-mcq-app.onrender.com';

export const API_ENDPOINTS = {
  FORGOT_PASSWORD: `${API_BASE_URL}/api/forgot-password/`,
  VERIFY_OTP: `${API_BASE_URL}/api/verify-otp/`,
  RESET_PASSWORD: `${API_BASE_URL}/api/reset-password/`,
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