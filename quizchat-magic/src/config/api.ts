import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://backend-qvzn.onrender.com/api';

export const API_CONFIG = {
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
}; 