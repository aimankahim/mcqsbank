import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, ScrollText, MessageSquare } from 'lucide-react';

const API_BASE_URL = 'https://mcqs-bank-backend.onrender.com';

const PDFView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        if (!id) return;
        
        console.log('Fetching PDF from:', `${API_BASE_URL}/api/pdfs/${id}/download/`);
        const response = await fetch(`${API_BASE_URL}/api/pdfs/${id}/download/`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/pdf',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(errorData.error || `Failed to load PDF: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load PDF',
          variant: 'destructive',
        });
        navigate('/pdfs');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [id, navigate, toast]);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/pdfs')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDFs
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
          {isLoading ? (
            <div className="flex justify-center items-center h-[800px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border rounded-lg"
              title="PDF Viewer"
            />
          ) : (
            <div className="flex justify-center items-center h-[800px] text-muted-foreground">
              PDF not found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFView; 