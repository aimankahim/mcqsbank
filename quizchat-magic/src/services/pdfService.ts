import axios from 'axios';
import { authService } from './auth';

export interface PDF {
  id: string;
  title: string;
  uploaded_at: string;
}

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

      return response.data;
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to fetch PDFs';
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

      await axios.delete(`${this.baseURL}/chat/pdfs/${pdfId}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to delete PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const pdfService = new PDFService(); 