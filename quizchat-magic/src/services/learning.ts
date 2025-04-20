import axios from 'axios';
import { authService } from './auth';

interface PDFInput {
  pdf_id: string;
  num_items?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface FlashcardItem {
  question: string;
  answer: string;
}

interface Flashcard {
  flashcards: FlashcardItem[];
}

interface Notes {
  notes: string;
}

interface GenerateNotesRequest {
  pdf_id: string;
}

interface GenerateNotesResponse {
  notes: string;
}

interface Note {
  id: string;
  content: string;
  pdf_name: string;
  created_at: string;
}

class LearningService {
  private baseURL = 'https://django-based-mcq-app.onrender.com/api';

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(`Making request to ${endpoint} with data:`, data);
      
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Response from ${endpoint}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           error.message || 
                           `Failed to make request to ${endpoint}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async generateNotes(input: PDFInput): Promise<Notes> {
    return this.makeRequest<Notes>('/generate-notes/', input);
  }

  async generateQuiz(input: PDFInput): Promise<Quiz> {
    return this.makeRequest<Quiz>('/generate-quiz/', input);
  }

  async generateFlashcards(input: PDFInput): Promise<Flashcard> {
    return this.makeRequest<Flashcard>('/generate-flashcards/', input);
  }

  async getRecentNotes(): Promise<any[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/notes/recent/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recent notes:', error);
      throw error;
    }
  }

  async getNote(id: string): Promise<Note> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/notes/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  }

  async getRecentQuizzes(): Promise<any[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/quizzes/recent/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recent quizzes:', error);
      throw error;
    }
  }

  async getRecentFlashcards(): Promise<any[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${this.baseURL}/flashcards/recent/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recent flashcards:', error);
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

      console.log('Uploading PDF:', file.name);

      const response = await axios.post(`${this.baseURL}/upload-pdf/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Upload response:', response.data);

      if (!response.data.pdf_id) {
        throw new Error('Invalid response from server');
      }
      
      return response.data.pdf_id;
    } catch (error) {
      console.error('PDF upload error:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to upload PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async generateNotesFromPDF(request: GenerateNotesRequest): Promise<GenerateNotesResponse> {
    const response = await axios.post(`${this.baseURL}/pdfs/${request.pdf_id}/notes/`, {});
    return response.data;
  }

  async saveNote(note: { title: string; content: string; source_text: string }): Promise<any> {
    return this.makeRequest('/notes/', note);
  }
}

export const learningService = new LearningService(); 
