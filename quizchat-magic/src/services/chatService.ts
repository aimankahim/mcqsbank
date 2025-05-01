import axios from 'axios';
import type { AxiosError } from 'axios';
import { authService } from './auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiError {
  error?: string;
  detail?: string;
}

interface UploadResponse {
  message: string;
  pdf_id: string;
}

interface ChatResponse {
  response: string;
}

class ChatService {
  private baseURL = 'https://mcqs-bank-frontend.onrender.com/api';

  async uploadPDF(file: File): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading PDF for chat:', file.name);

      const response = await axios.post<UploadResponse>(`${this.baseURL}/chat/upload-pdf/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Upload response:', response.data);

      if (!response.data.pdf_id) {
        throw new Error('Server did not return a PDF ID');
      }
      
      return response.data.pdf_id;
    } catch (error) {
      console.error('PDF upload error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage = axiosError.response?.data?.error || 
                           axiosError.response?.data?.detail || 
                           'Failed to upload PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async sendMessage(message: string, pdfId: string): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Sending chat message:', { message, pdfId });

      const response = await axios.post<ChatResponse>(`${this.baseURL}/chat/`, {
        message,
        pdf_id: pdfId.toString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Chat response:', response.data);

      if (!response.data.response) {
        throw new Error('Invalid response from server');
      }

      return response.data.response;
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage = axiosError.response?.data?.error || 
                           axiosError.response?.data?.detail || 
                           'Failed to send message';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const chatService = new ChatService(); 
