import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { RecentItems } from '@/components/RecentItems';
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

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
}

interface RecentNote {
  id: string;
  pdf_name: string;
  content: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { pdfs } = usePDF();
  const { flashcards, getFlashcardsByPDF } = useLearning();
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState<RecentItem[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<RecentItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);

  const totalFlashcards = pdfs.reduce((total, pdf) => {
    return total + getFlashcardsByPDF(pdf.id).length;
  }, 0);

  const recentPdfs = pdfs.slice(0, 3);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const [quizzes, flashcards, notes] = await Promise.all([
          learningService.getRecentQuizzes(),
          learningService.getRecentFlashcards(),
          learningService.getRecentNotes(),
        ]);

        setRecentQuizzes(quizzes);
        setRecentFlashcards(flashcards);
        setRecentNotes(notes);
      } catch (error) {
        console.error('Error fetching recent items:', error);
      }
    };

    fetchRecentItems();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your learning materials and activities
            </p>
          </div>
          
          <Button 
            className="flex items-center" 
            onClick={() => navigate('/upload')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                PDFs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pdfs.length}</div>
              <p className="text-sm text-muted-foreground">
                Total PDFs uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalFlashcards}</div>
              <p className="text-sm text-muted-foreground">
                Total flashcards created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <ScrollText className="h-5 w-5 mr-2 text-primary" />
                Learning Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">3</div>
              <p className="text-sm text-muted-foreground">
                Available learning tools
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent PDFs</CardTitle>
              <CardDescription>
                Your most recently uploaded PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPdfs.length > 0 ? (
                <div className="space-y-4">
                  {recentPdfs.map((pdf) => {
                    const pdfFlashcards = getFlashcardsByPDF(pdf.id);
                    return (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{pdf.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {pdfFlashcards.length} flashcards created
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/flashcards?pdfId=${pdf.id}`)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Study
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No PDFs yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first PDF to start learning
                  </p>
                  <Button onClick={() => navigate('/upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <RecentItems />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/flashcards')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Create Flashcards
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/quizzes')}
                >
                  <ScrollText className="h-4 w-4 mr-2" />
                  Generate Quiz
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/notes')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Notes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Stats</CardTitle>
              <CardDescription>
                Your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">PDFs Processed</span>
                    <span className="text-sm text-muted-foreground">
                      {pdfs.length} total
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ 
                        width: `${pdfs.length > 0 ? 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Flashcards Created</span>
                    <span className="text-sm text-muted-foreground">
                      {totalFlashcards} total
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ 
                        width: `${totalFlashcards > 0 ? 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Quizzes</CardTitle>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <ul className="space-y-2">
                  {recentQuizzes.map((quiz) => (
                    <li key={quiz.id} className="flex items-center justify-between">
                      <span className="text-sm truncate">{quiz.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(quiz.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent quizzes</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/quizzes')}
              >
                View All Quizzes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Flashcards</CardTitle>
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentFlashcards.length > 0 ? (
                <ul className="space-y-2">
                  {recentFlashcards.map((flashcard) => (
                    <li key={flashcard.id} className="flex items-center justify-between">
                      <span className="text-sm truncate">{flashcard.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(flashcard.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent flashcards</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/flashcards')}
              >
                View All Flashcards
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentNotes.length > 0 ? (
                <ul className="space-y-2">
                  {recentNotes.map((note) => (
                    <li key={note.id} className="flex items-center justify-between">
                      <span className="text-sm truncate">{note.pdf_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent notes</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/notes')}
              >
                View All Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
