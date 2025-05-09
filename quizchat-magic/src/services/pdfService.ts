import axios from 'axios';
import { authService } from './auth';

export interface PDF {
  id: string;
  title: string;
  uploaded_at: string;
}

interface ApiError {
  error?: string;
  detail?: string;
}

const isAxiosError = (error: any): error is { response?: { data?: ApiError } } => {
  return error.isAxiosError === true;
};

class PDFService {
  private baseURL = 'https://django-based-mcq-app.onrender.com/api';

  async getPDFs(): Promise<PDF[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/chat/pdfs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data as PDF[];
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to fetch PDFs';
        throw new Error(errorMessage);
      }
      throw error;
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

      const response = await axios.post(`${this.baseURL}/chat/upload-pdf/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data as { pdf_id: string };
      if (!data.pdf_id) {
        throw new Error('Invalid response from server');
      }

      return data.pdf_id;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to upload PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async deletePDF(pdfId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete(`${this.baseURL}/chat/pdf/${pdfId}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to delete PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async downloadPDF(pdfId: string, title: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/chat/pdf/${pdfId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to download PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const pdfService = new PDFService();