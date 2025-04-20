import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://django-based-mcq-app.onrender.com';

export const API_CONFIG = {
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true
}; 
