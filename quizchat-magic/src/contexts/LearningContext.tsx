import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePDF } from './PDFContext';
import { learningService } from '../services/learning';

// Types
type FlashCard = {
  id: string;
  pdfId: string;
  front: string;
  back: string;
  createdAt: Date;
  lastViewed?: Date;
};

type Quiz = {
  id: string;
  pdfId: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type Note = {
  id: string;
  pdfId: string;
  title: string;
  content: string;
  createdAt: Date;
};

type ChatMessage = {
  id: string;
  pdfId: string | null;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
};

type LearningContextType = {
  flashcards: FlashCard[];
  quizzes: Quiz[];
  notes: Note[];
  chatHistory: ChatMessage[];
  recentFlashcards: FlashCard[];
  addFlashCard: (card: Omit<FlashCard, 'id' | 'createdAt'>) => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  getFlashcardsByPDF: (pdfId: string) => FlashCard[];
  getQuizzesByPDF: (pdfId: string) => Quiz[];
  getNotesByPDF: (pdfId: string) => Note[];
  getChatHistoryByPDF: (pdfId: string | null) => ChatMessage[];
  deleteFlashCard: (id: string) => void;
  deleteQuiz: (id: string) => void;
  deleteNote: (id: string) => void;
  generateQuizFromPDF: (pdfId: string, numQuestions?: number) => Promise<Quiz>;
  updateFlashcardLastViewed: (id: string) => void;
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { pdfs, loading: pdfsLoading } = usePDF();
  const { toast } = useToast();

  // Load flashcards from localStorage on mount
  useEffect(() => {
    if (pdfsLoading) return; // Don't load flashcards until PDFs are loaded
    
    try {
      const savedFlashcards = localStorage.getItem('flashcards');
      if (savedFlashcards) {
        const parsedFlashcards = JSON.parse(savedFlashcards).map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          lastViewed: card.lastViewed ? new Date(card.lastViewed) : undefined
        }));
        setFlashcards(parsedFlashcards);
      }
    } catch (error) {
      console.error('Error loading flashcards from localStorage:', error);
      setFlashcards([]);
    }
  }, [pdfsLoading]);

  // Save flashcards to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('flashcards', JSON.stringify(flashcards));
    } catch (error) {
      console.error('Error saving flashcards to localStorage:', error);
    }
  }, [flashcards]);

  // Get recent flashcards (last 5 viewed)
  const recentFlashcards = flashcards
    .filter(card => card.lastViewed)
    .sort((a, b) => {
      const aTime = a.lastViewed?.getTime() || 0;
      const bTime = b.lastViewed?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const addFlashCard = (card: Omit<FlashCard, 'id' | 'createdAt'>) => {
    const newCard = {
      ...card,
      id: String(Date.now()),
      createdAt: new Date(),
      lastViewed: new Date()
    };
    setFlashcards(prev => [...prev, newCard]);
    toast({
      title: "Flashcard created",
      description: "Your new flashcard has been created.",
    });
    return newCard;
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'createdAt'>) => {
    const newQuiz = {
      ...quiz,
      id: String(Date.now()),
      createdAt: new Date()
    };
    setQuizzes(prev => [...prev, newQuiz]);
    toast({
      title: "Quiz created",
      description: `Quiz "${quiz.title}" has been created.`,
    });
    return newQuiz;
  };

  const addNote = (note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote = {
      ...note,
      id: String(Date.now()),
      createdAt: new Date()
    };
    setNotes(prev => [...prev, newNote]);
    toast({
      title: "Note created",
      description: `Note "${note.title}" has been created.`,
    });
    return newNote;
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage = {
      ...message,
      id: String(Date.now()),
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, newMessage]);
    return newMessage;
  };

  const getFlashcardsByPDF = (pdfId: string) => {
    return flashcards.filter(card => card.pdfId === pdfId);
  };

  const getQuizzesByPDF = (pdfId: string) => {
    return quizzes.filter(quiz => quiz.pdfId === pdfId);
  };

  const getNotesByPDF = (pdfId: string) => {
    return notes.filter(note => note.pdfId === pdfId);
  };

  const getChatHistoryByPDF = (pdfId: string | null) => {
    return chatHistory.filter(msg => msg.pdfId === pdfId);
  };

  const deleteFlashCard = (id: string) => {
    setFlashcards(prev => prev.filter(card => card.id !== id));
    toast({
      title: "Flashcard deleted",
      description: "The flashcard has been deleted.",
    });
  };

  const deleteQuiz = (id: string) => {
    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    toast({
      title: "Quiz deleted",
      description: "The quiz has been deleted.",
    });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast({
      title: "Note deleted",
      description: "The note has been deleted.",
    });
  };

  const generateQuizFromPDF = async (pdfId: string, numQuestions: number = 5): Promise<Quiz> => {
    try {
      const pdf = pdfs.find(p => p.id === pdfId);
      if (!pdf) {
        throw new Error('PDF not found');
      }

      const quiz = await learningService.generateQuiz({
        pdf_id: pdfId,
        num_items: numQuestions,
        quiz_type: 'multiple_choice'
      });

      const newQuiz = addQuiz({
        pdfId,
        title: `Quiz from ${pdf.title}`,
        questions: quiz.questions.map(q => ({
          id: String(Date.now() + Math.random()),
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer
        }))
      });

      return newQuiz;
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFlashcardLastViewed = (id: string) => {
    setFlashcards(prev => prev.map(card => 
      card.id === id 
        ? { ...card, lastViewed: new Date() }
        : card
    ));
  };

  return (
    <LearningContext.Provider value={{ 
      flashcards,
      quizzes,
      notes,
      chatHistory,
      recentFlashcards,
      addFlashCard,
      addQuiz,
      addNote,
      addChatMessage,
      getFlashcardsByPDF,
      getQuizzesByPDF,
      getNotesByPDF,
      getChatHistoryByPDF,
      deleteFlashCard,
      deleteQuiz,
      deleteNote,
      generateQuizFromPDF,
      updateFlashcardLastViewed
    }}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

export default LearningContext;
