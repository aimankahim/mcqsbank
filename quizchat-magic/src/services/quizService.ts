import axios from 'axios';

const API_URL = 'https://django-based-mcq-app.onrender.com';

// Get the auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };
};

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  correct_answer: string;
  options: string[];
  created_at: string;
}

export interface Flashcard {
  id: number;
  title: string;
  front_content: string;
  back_content: string;
  created_at: string;
  updated_at: string;
}

export const quizService = {
  // Quiz operations
  createQuiz: async (quizData: Partial<Quiz>) => {
    const response = await axios.post(`${API_URL}/quizzes/`, quizData, getAuthHeaders());
    return response.data;
  },

  getQuiz: async (id: string) => {
    const response = await axios.get(`${API_URL}/quizzes/${id}/`, getAuthHeaders());
    return response.data;
  },

  getRecentQuizzes: async () => {
    const response = await axios.get(`${API_URL}/quizzes/recent/`, getAuthHeaders());
    return response.data;
  },

  addQuestionToQuiz: async (quizId: number, questionData: Partial<QuizQuestion>) => {
    const response = await axios.post(
      `${API_URL}/quizzes/${quizId}/add_question/`,
      questionData,
      getAuthHeaders()
    );
    return response.data;
  },

  // Flashcard operations
  createFlashcard: async (flashcardData: Partial<Flashcard>) => {
    const response = await axios.post(`${API_URL}/flashcards/`, flashcardData, getAuthHeaders());
    return response.data;
  },

  getFlashcard: async (id: string) => {
    const response = await axios.get(`${API_URL}/flashcards/${id}/`, getAuthHeaders());
    return response.data;
  },

  getRecentFlashcards: async () => {
    const response = await axios.get(`${API_URL}/flashcards/recent/`, getAuthHeaders());
    return response.data;
  },
}; 
