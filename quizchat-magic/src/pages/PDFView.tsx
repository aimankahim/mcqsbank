import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, ScrollText, MessageSquare, Trash2, Download, FileText } from 'lucide-react';
import { pdfService } from '@/services/pdfService';

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
        const pdfs = await pdfService.getPDFs();
        const currentPdf = pdfs.find(p => p.id === id);
        if (!currentPdf) throw new Error('PDF not found');
        setPdf(currentPdf);
        
        // Create a blob URL for the PDF
        await pdfService.downloadPDF(id, currentPdf.title);
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

  const handleDelete = async () => {
    try {
      if (!id) return;
      await pdfService.deletePDF(id);
      toast({
        title: 'Success',
        description: 'PDF deleted successfully',
      });
      navigate('/pdfs');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async () => {
    try {
      if (!id || !pdf) return;
      await pdfService.downloadPDF(id, pdf.title);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!pdf) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">PDF not found</h2>
          <Button
            size="lg"
            onClick={() => navigate('/pdfs')}
            className="bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to PDFs
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              PDF Viewer
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View and interact with your PDF document
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/pdfs')}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to PDFs
                  </Button>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{pdf.title}</h2>
                    <p className="text-gray-600">View and interact with your PDF</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/flashcards?pdf=${id}`)}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Create Flashcards
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/quizzes?pdf=${id}`)}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <ScrollText className="h-5 w-5 mr-2" />
                    Generate Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/chat?pdf=${id}`)}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Chat with PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownload}
                    className="h-12 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleDelete}
                    className="h-12"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {pdfUrl && (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-[800px] border rounded-lg shadow-inner"
                  >
                    <p className="text-center py-8 text-gray-600">
                      Unable to display PDF file. 
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-700 ml-2 underline"
                      >
                        Download
                      </a> 
                      instead.
                    </p>
                  </object>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PDFView; 