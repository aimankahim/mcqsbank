import axios from 'axios';
import { authService } from './auth';
import { config } from '../config';

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
  private baseURL = config.API_URL;

  async getPDFs(): Promise<PDF[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/api/pdfs/`, {
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

  async uploadPDF(file: File): Promise<PDF> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${this.baseURL}/api/pdfs/upload/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data.pdf_id) {
        throw new Error('Invalid response from server');
      }

      // Create a PDF object with the response data
      return {
        id: response.data.pdf_id,
        title: file.name,
        uploaded_at: new Date().toISOString()
      };
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

      await axios.delete(`${this.baseURL}/api/pdfs/${pdfId}/delete/`, {
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

  async downloadPDF(pdfId: string): Promise<Blob> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/api/pdfs/${pdfId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      return response.data;
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

  async getPDFForViewing(pdfId: string): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/pdfs/${pdfId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // Create a URL for the blob
      return window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    } catch (error) {
      console.error('Error getting PDF for viewing:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to get PDF for viewing';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const pdfService = new PDFService();
