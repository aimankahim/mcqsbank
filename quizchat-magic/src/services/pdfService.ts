import axios from 'axios';
import { authService } from './auth';

export interface PDF {
  id: string;
  title: string;
  uploaded_at: string;
  file_path?: string;
}

interface PDFUploadResponse {
  pdf_id: string;
  file_path: string;
}

interface PDFListResponse {
  pdfs: PDF[];
}

interface ApiError {
  error?: string;
  detail?: string;
}

class PDFService {
  private baseURL = 'https://django-based-mcq-app.onrender.com/api';

  private handleError(error: unknown): never {
    console.error('API Error:', error);
    if (typeof error === 'object' && error !== null) {
      const apiError = error as { response?: { data?: ApiError } };
      if (apiError.response?.data) {
        const errorMessage = apiError.response.data.error || 
                           apiError.response.data.detail || 
                           'An error occurred';
        throw new Error(errorMessage);
      }
    }
    throw new Error('An unexpected error occurred');
  }

  async getPDFs(): Promise<PDF[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get<PDFListResponse>(`${this.baseURL}/chat/pdfs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.pdfs;
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadPDF(file: File): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<PDFUploadResponse>(`${this.baseURL}/chat/upload-pdf/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data.pdf_id) {
        throw new Error('Invalid response from server');
      }

      return response.data.pdf_id;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deletePDF(pdfId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete(`${this.baseURL}/chat/pdfs/${pdfId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const pdfService = new PDFService(); 