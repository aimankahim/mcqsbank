import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePDF } from './PDFContext';

// Types
type FlashCard = {
  id: string;
  pdfId: string;
  front: string;
  back: string;
  createdAt: Date;
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
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { pdfs } = usePDF();
  const { toast } = useToast();

  // Load flashcards from localStorage on mount
  useEffect(() => {
    const savedFlashcards = localStorage.getItem('flashcards');
    if (savedFlashcards) {
      setFlashcards(JSON.parse(savedFlashcards));
    }
  }, []);

  // Save flashcards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const addFlashCard = (card: Omit<FlashCard, 'id' | 'createdAt'>) => {
    const newCard = {
      ...card,
      id: String(Date.now()),
      createdAt: new Date()
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
      if (!pdf) throw new Error("PDF not found");
      
      // In a real app, this would use an AI service to generate questions
      // For now, we'll simulate with dummy data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockQuestions: QuizQuestion[] = Array(numQuestions).fill(0).map((_, i) => ({
        id: `q-${Date.now()}-${i}`,
        question: `Sample question ${i + 1} about ${pdf.name}?`,
        options: [
          "Sample option A",
          "Sample option B",
          "Sample option C", 
          "Sample option D"
        ],
        correctAnswer: "Sample option A"
      }));
      
      const newQuiz = {
        id: String(Date.now()),
        pdfId,
        title: `Quiz on ${pdf.name}`,
        questions: mockQuestions,
        createdAt: new Date()
      };
      
      setQuizzes(prev => [...prev, newQuiz]);
      
      toast({
        title: "Quiz generated",
        description: `A new quiz with ${numQuestions} questions has been created.`,
      });
      
      return newQuiz;
    } catch (error) {
      toast({
        title: "Failed to generate quiz",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <LearningContext.Provider value={{ 
      flashcards,
      quizzes,
      notes,
      chatHistory,
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
      generateQuizFromPDF
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
