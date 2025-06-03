import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Repeat, Brain } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!flashcard) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Flashcard not found</h2>
            <Button 
              onClick={() => navigate('/flashcards')}
              className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Back to Flashcards
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/flashcards')}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Flashcards
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{flashcard.title}</h1>
                    <p className="text-gray-600">Study this flashcard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard Content */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 relative overflow-hidden group">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-brand-600">
                  Study Flashcard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="min-h-[400px] p-8 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-brand-200 transition-colors duration-200"
                  onClick={() => setShowBack(!showBack)}
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-brand-600 mb-4">
                        {showBack ? 'Back' : 'Front'}
                      </h3>
                      <p className="text-2xl leading-relaxed">
                        {showBack ? flashcard.back_content : flashcard.front_content}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBack(!showBack);
                      }}
                      className="h-12 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Repeat className="h-5 w-5 mr-2" />
                      Flip Card
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlashcardView; 