import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, ScrollText, MessageSquare } from 'lucide-react';
import { usePDF } from '@/contexts/PDFContext';

const PDFView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getPDFById } = usePDF();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        if (!id) return;
        const pdf = getPDFById(id);
        if (!pdf) {
          toast({
            title: 'Error',
            description: 'PDF not found',
            variant: 'destructive',
          });
          navigate('/upload');
          return;
        }
        setPdfUrl(`/uploads/${id}.pdf`);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to load PDF',
          variant: 'destructive',
        });
        navigate('/upload');
      }
    };

    loadPDF();
  }, [id, navigate, toast, getPDFById]);

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/upload')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <h1 className="text-3xl font-bold">View PDF</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/flashcards?pdf=${id}`)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Create Flashcards
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/quizzes?pdf=${id}`)}
            >
              <ScrollText className="h-4 w-4 mr-2" />
              Generate Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/chat?pdf=${id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PDF Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-[800px] border rounded-lg"
                title="PDF Viewer"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PDFView; 