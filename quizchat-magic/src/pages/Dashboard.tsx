import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Upload,
  FileText,
  Brain,
  ScrollText,
  BookOpen,
  Plus,
  BrainCircuit
} from 'lucide-react';
import { learningService } from '@/services/learning';
import { format } from 'date-fns';

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
}

interface RecentNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { pdfs } = usePDF();
  const { flashcards, getFlashcardsByPDF, recentFlashcards, updateFlashcardLastViewed } = useLearning();
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState<RecentItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);

  const totalFlashcards = pdfs.reduce((total, pdf) => {
    return total + getFlashcardsByPDF(pdf.id).length;
  }, 0);

  const recentPdfs = pdfs.slice(0, 3);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const [quizzes, notes] = await Promise.all([
          learningService.getRecentQuizzes(),
          learningService.getRecentNotes(),
        ]);

        setRecentQuizzes(quizzes);
        setRecentNotes(notes);
      } catch (error) {
        console.error('Error fetching recent items:', error);
      }
    };

    fetchRecentItems();
  }, []);

  const handleFlashcardClick = (flashcardId: string) => {
    updateFlashcardLastViewed(flashcardId);
    navigate(`/flashcards?flashcard=${flashcardId}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                PDFs
              </CardTitle>
              <CardDescription>Total PDFs uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pdfs.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Flashcards
              </CardTitle>
              <CardDescription>Total flashcards created</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalFlashcards}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ScrollText className="h-5 w-5 mr-2" />
                Quizzes
              </CardTitle>
              <CardDescription>Total quizzes generated</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{recentQuizzes.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent PDFs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent PDFs</CardTitle>
              <CardDescription>Your recently uploaded PDFs</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPdfs.length > 0 ? (
                <div className="space-y-4">
                  {recentPdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => navigate(`/pdfs/${pdf.id}`)}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>{pdf.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(pdf.uploaded_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No PDFs uploaded yet</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate('/upload')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Flashcards */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Flashcards</CardTitle>
              <CardDescription>Your recently viewed flashcards</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFlashcards.length > 0 ? (
                <div className="space-y-4">
                  {recentFlashcards.map((flashcard) => (
                    <div
                      key={flashcard.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => handleFlashcardClick(flashcard.id)}
                    >
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        <span className="truncate max-w-[200px]">{flashcard.front}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {flashcard.lastViewed && format(new Date(flashcard.lastViewed), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No flashcards viewed yet</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate('/flashcards')}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Create Flashcards
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Your recently generated quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {recentQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => navigate(`/quizzes/${quiz.id}`)}
                    >
                      <div className="flex items-center">
                        <ScrollText className="h-4 w-4 mr-2" />
                        <span>{quiz.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No quizzes generated yet</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate('/quizzes')}
                  >
                    <ScrollText className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
