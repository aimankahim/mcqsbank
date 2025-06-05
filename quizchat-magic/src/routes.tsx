import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from '@/components/auth/PrivateRoute';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import PDFList from '@/pages/PDFList';
import PDFView from '@/pages/PDFView';
import Flashcards from '@/pages/Flashcards';
import Quizzes from '@/pages/Quizzes';
import QuizView from '@/pages/QuizView';
import FlashcardView from '@/pages/FlashcardView';
import Notes from '@/pages/Notes';
import NoteView from '@/pages/NoteView';
import Chat from '@/pages/Chat';
import NotFound from '@/pages/NotFound';
import ForgotPassword from '@/pages/ForgotPassword';
import Register from '@/pages/Register';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/upload" element={<PrivateRoute element={<Upload />} />} />
      <Route path="/pdfs" element={<PrivateRoute element={<PDFList />} />} />
      <Route path="/pdfs/:id" element={<PrivateRoute element={<PDFView />} />} />
      <Route path="/flashcards" element={<PrivateRoute element={<Flashcards />} />} />
      <Route path="/flashcards/:id" element={<PrivateRoute element={<FlashcardView />} />} />
      <Route path="/quizzes" element={<PrivateRoute element={<Quizzes />} />} />
      <Route path="/quizzes/:id" element={<PrivateRoute element={<QuizView />} />} />
      <Route path="/notes" element={<PrivateRoute element={<Notes />} />} />
      <Route path="/notes/:id" element={<PrivateRoute element={<NoteView />} />} />
      <Route path="/chat" element={<PrivateRoute element={<Chat />} />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute element={<Dashboard />} />,
  },
  {
    path: '/quiz/:id',
    element: <PrivateRoute element={<QuizView />} />,
  },
  {
    path: '/flashcards',
    element: <PrivateRoute element={<Flashcards />} />,
  },
  {
    path: '/notes',
    element: <PrivateRoute element={<Notes />} />,
  },
  {
    path: '/pdf/:id',
    element: <PrivateRoute element={<PDFView />} />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default AppRoutes; 