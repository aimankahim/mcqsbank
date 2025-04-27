import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, ScrollText, MessageSquare } from 'lucide-react';

interface PDF {
  id: string;
  title: string;
  uploaded_at: string;
}

const PDFView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        if (!id) return;
        const response = await fetch(`/api/chat/pdf/${id}/`);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const data = await response.json();
        setPdf(data);
        
        // Create a blob URL for the PDF
        const downloadResponse = await fetch(`/api/chat/pdf/${id}/download/`);
        if (!downloadResponse.ok) throw new Error('Failed to fetch PDF content');
        const blob = await downloadResponse.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to load PDF',
          variant: 'destructive',
        });
        navigate('/pdfs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPDF();

    // Clean up the blob URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [id, navigate, toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!pdf) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-semibold mb-4">PDF not found</h2>
          <Button onClick={() => navigate('/pdfs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDFs
          </Button>
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
              onClick={() => navigate('/pdfs')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to PDFs
            </Button>
            <h1 className="text-3xl font-bold">{pdf.title}</h1>
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
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-[800px] border rounded-lg"
              >
                <p>Unable to display PDF file. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> instead.</p>
              </object>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PDFView; 