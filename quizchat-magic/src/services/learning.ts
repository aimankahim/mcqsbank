import axios from 'axios';
import { authService } from './auth';

interface PDFInput {
  pdf_id: string;
  num_items?: number;
  difficulty?: string;
  language?: string;
  quiz_type?: string;
  content?: {
    quiz_type?: string;
  };
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

interface Quiz {
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    statement?: string;  // For true/false questions, this will be the statement to evaluate
  }>;
  quiz_type?: string;
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

// Type guard for AxiosError
function isAxiosError(error: unknown): error is { response?: { data?: { error?: string; detail?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

class LearningService {
  private baseURL = 'https://django-based-mcq-app.onrender.com/api';

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}`);
      }

      return response.data as T;
    } catch (error) {
      console.error('API Error:', error);
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           'Failed to process request';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async generateNotes(input: PDFInput): Promise<Notes> {
    return this.makeRequest<Notes>('/learning/generate-notes/', input);
  }

  async generateQuiz(input: PDFInput): Promise<Quiz> {
    console.log('Generating quiz with input:', input); // Debug log
    
    // For true/false questions, ensure we're sending the correct format
    if (input.quiz_type === 'true_false') {
      const transformedInput = {
        ...input,
        content: {
          ...input.content,
          quiz_type: 'true_false',
          format: 'statement'  // Indicate we want statements for true/false evaluation
        }
      };
      return this.makeRequest<Quiz>('/learning/generate-quiz/', transformedInput);
    }
    
    // Ensure language is included in the request
    const requestData = {
      ...input,
      language: input.language || 'English'  // Ensure language is always set
    };
    
    console.log('Sending quiz request with data:', requestData); // Debug log
    return this.makeRequest<Quiz>('/learning/generate-quiz/', requestData);
  }

  async generateFlashcards(input: PDFInput): Promise<Flashcard> {
    const transformedInput = {
      pdf_id: input.pdf_id,
      num_items: input.num_items || 5
    };
    return this.makeRequest<Flashcard>('/learning/generate-flashcards/', transformedInput);
  }

  async getRecentQuizzes(): Promise<Quiz[]> {
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

      return response.data as Quiz[];
    } catch (error) {
      console.error('Error fetching recent quizzes:', error);
      throw error;
    }
  }

  async getRecentFlashcards(): Promise<Flashcard[]> {
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

      return response.data as Flashcard[];
    } catch (error) {
      console.error('Error fetching recent flashcards:', error);
      throw error;
    }
  }

  async getRecentNotes(): Promise<Notes[]> {
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

      return response.data as Notes[];
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

      return response.data as Note;
    } catch (error) {
      console.error('Error fetching note:', error);
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

      const response = await axios.post(`${this.baseURL}/upload-pdf/`, formData, {
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
      console.error('PDF upload error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errorMessage = (error as any).response?.data?.error || 
                           (error as any).response?.data?.detail || 
                           'Failed to upload PDF';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async generateNotesFromPDF(request: GenerateNotesRequest): Promise<GenerateNotesResponse> {
    const response = await axios.post(`${this.baseURL}/pdfs/${request.pdf_id}/notes/`, {});
    return response.data as GenerateNotesResponse;
  }

  async saveNote(note: { title: string; content: string; source_text: string }): Promise<any> {
    return this.makeRequest('/notes/', note);
  }
}

export const learningService = new LearningService(); 
