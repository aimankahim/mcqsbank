import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Repeat, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { learningService } from '@/services/learning';
import { useLearning } from '@/contexts/LearningContext';

interface FlashcardData {
  id: string;
  title: string;
  front_content: string;
  back_content: string;
  created_at: string;
}

interface FlashcardResponse {
  flashcards: FlashcardData[];
}

const FlashcardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { flashcards } = useLearning();
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flashcardData, setFlashcardData] = useState<FlashcardData[]>([]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        if (!id) return;
        console.log('FlashcardView: id from URL:', id);
        console.log('FlashcardView: context flashcards:', flashcards);

        // First check if the flashcards exist in the context
        const contextFlashcards = flashcards.filter(card => card.pdfId === id);
        if (contextFlashcards.length > 0) {
          console.log('FlashcardView: found in context:', contextFlashcards);
          setFlashcardData(contextFlashcards.map(card => ({
            id: card.id,
            title: card.front,
            front_content: card.front,
            back_content: card.back,
            created_at: card.createdAt.toISOString()
          })));
          setLoading(false);
          return;
        }

        // If not found in context, try to fetch from API
        try {
          const response = await learningService.getFlashcardDetail(id);
          console.log('FlashcardView: fetched from backend:', response);
          setFlashcardData(response.flashcards);
        } catch (apiError) {
          console.error('FlashcardView: error fetching from backend:', apiError);
          throw apiError;
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        toast({
          title: 'Error',
          description: 'Failed to load flashcards',
          variant: 'destructive',
        });
        navigate('/flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [id, navigate, toast, flashcards]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!flashcardData || flashcardData.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">No flashcards found</h2>
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

  const currentCard = flashcardData[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === flashcardData.length - 1;

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
                    <h1 className="text-2xl font-bold text-gray-900">Study Flashcards</h1>
                    <p className="text-gray-600">Review your flashcards</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Flashcard Content */}
            <div className="flex flex-col items-center space-y-8">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 relative overflow-hidden group w-full max-w-3xl">
                <CardContent className="p-12">
                  <div 
                    className={`transition-all duration-500 transform perspective-1000 ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className={`${isFlipped ? 'hidden' : 'block'} backface-hidden min-h-[400px] flex flex-col items-center justify-center`}>
                      <h3 className="text-xl font-medium mb-6 text-brand-600">Question</h3>
                      <p className="text-2xl leading-relaxed text-center">{currentCard.front_content}</p>
                    </div>
                    <div className={`${!isFlipped ? 'hidden' : 'block'} backface-hidden min-h-[400px] flex flex-col items-center justify-center`}>
                      <h3 className="text-xl font-medium mb-6 text-brand-600">Answer</h3>
                      <p className="text-2xl leading-relaxed text-center">{currentCard.back_content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center space-x-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="h-16 w-16 rounded-full hover:bg-brand-50 hover:text-brand-600"
                >
                  <Repeat className="h-8 w-8" />
                </Button>
              </div>
              {/* Pagination Arrows */}
              <div className="flex items-center justify-center space-x-8 mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentIndex(idx => Math.max(0, idx - 1))}
                  disabled={isFirst}
                  className="h-20 w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                >
                  <ChevronLeft className="h-10 w-10" />
                </Button>
                <div className="text-center">
                  <span className="text-3xl font-bold text-brand-600">
                    {currentIndex + 1}
                  </span>
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-3xl font-bold text-gray-600">
                    {flashcardData.length}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentIndex(idx => Math.min(flashcardData.length - 1, idx + 1))}
                  disabled={isLast}
                  className="h-20 w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                >
                  <ChevronRight className="h-10 w-10" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlashcardView;