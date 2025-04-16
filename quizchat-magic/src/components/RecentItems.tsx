import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Brain, ScrollText, StickyNote } from 'lucide-react';
import { learningService } from '@/services/learning';

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  title: string;
  front_content: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export function RecentItems() {
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<Flashcard[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Log the auth token
        console.log('Auth token:', localStorage.getItem('token'));
        
        // Fetch quizzes
        let quizzes = [];
        try {
          quizzes = await learningService.getRecentQuizzes();
          console.log('Successfully fetched quizzes:', quizzes);
        } catch (quizError) {
          console.error('Error fetching quizzes:', quizError);
          console.error('Quiz error response:', quizError.response?.data);
        }
        
        // Fetch flashcards
        let flashcards = [];
        try {
          flashcards = await learningService.getRecentFlashcards();
          console.log('Successfully fetched flashcards:', flashcards);
        } catch (flashcardError) {
          console.error('Error fetching flashcards:', flashcardError);
          console.error('Flashcard error response:', flashcardError.response?.data);
        }

        // Fetch notes
        let notes = [];
        try {
          notes = await learningService.getRecentNotes();
          console.log('Successfully fetched notes:', notes);
        } catch (noteError) {
          console.error('Error fetching notes:', noteError);
          console.error('Note error response:', noteError.response?.data);
        }
        
        setRecentQuizzes(quizzes);
        setRecentFlashcards(flashcards);
        setRecentNotes(notes);
      } catch (err) {
        console.error('General error in fetchRecentItems:', err);
        if (err.response) {
          console.error('Error response:', {
            data: err.response.data,
            status: err.response.status,
            headers: err.response.headers,
          });
        }
        setError('Failed to load recent items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScrollText className="h-5 w-5 mr-2" />
            Recent Quizzes
          </CardTitle>
          <CardDescription>Your recently created quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/quizzes/${quiz.id}`)}
                  >
                    <h3 className="font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {formatDistanceToNow(new Date(quiz.created_at))} ago
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No quizzes yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/quizzes')}
                >
                  Create Quiz
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </div>

      <div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Recent Flashcards
          </CardTitle>
          <CardDescription>Your recently created flashcards</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {recentFlashcards.length > 0 ? (
              <div className="space-y-4">
                {recentFlashcards.map((flashcard) => (
                  <div
                    key={flashcard.id}
                    className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/flashcards/${flashcard.id}`)}
                  >
                    <h3 className="font-semibold">{flashcard.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Front: {flashcard.front_content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {formatDistanceToNow(new Date(flashcard.created_at))} ago
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No flashcards yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/flashcards')}
                >
                  Create Flashcards
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </div>

      <div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <StickyNote className="h-5 w-5 mr-2" />
            Recent Notes
          </CardTitle>
          <CardDescription>Your recently created notes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {recentNotes.length > 0 ? (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/notes/${note.id}`)}
                  >
                    <p className="text-sm text-gray-500 mt-1">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {formatDistanceToNow(new Date(note.created_at))} ago
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No notes yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/notes')}
                >
                  Create Notes
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </div>
    </div>
  );
} 