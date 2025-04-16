import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Repeat } from 'lucide-react';
import { quizService } from '@/services/quizService';

interface Flashcard {
  id: number;
  title: string;
  front_content: string;
  back_content: string;
  created_at: string;
}

const FlashcardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const fetchFlashcard = async () => {
      try {
        if (!id) return;
        const response = await quizService.getFlashcard(id);
        setFlashcard(response);
      } catch (error) {
        console.error('Error fetching flashcard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load flashcard',
          variant: 'destructive',
        });
        navigate('/flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcard();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!flashcard) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Flashcard not found</h2>
          <Button onClick={() => navigate('/flashcards')}>Back to Flashcards</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/flashcards')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Flashcards
            </Button>
            <h1 className="text-3xl font-bold">{flashcard.title}</h1>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Study Flashcard</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="min-h-[300px] p-8 border rounded-lg cursor-pointer"
              onClick={() => setShowBack(!showBack)}
            >
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-lg text-center">
                  {showBack ? flashcard.back_content : flashcard.front_content}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBack(!showBack);
                  }}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Flip Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default FlashcardView; 