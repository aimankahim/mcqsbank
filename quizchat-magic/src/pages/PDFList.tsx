import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Trash2, Download, RefreshCw, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { pdfService } from '@/services/pdfService';

interface PDF {
  id: string;
  title: string;
  uploaded_at: string;
}

const PDFList: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPDFs = async () => {
    try {
      setIsLoading(true);
      const data = await pdfService.getPDFs();
      setPdfs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch PDFs',
        variant: 'destructive',
      });
      setPdfs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleDelete = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pdfService.deletePDF(pdfId);
      await fetchPDFs();
      toast({
        title: 'Success',
        description: 'PDF deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (pdfId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pdfService.downloadPDF(pdfId, title);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section - Responsive */}
          <div className="text-center mb-8 md:mb-12 space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Your PDF Library
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Manage and interact with your uploaded PDF documents
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Header Section - Responsive */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">PDF Documents</h2>
                    <p className="text-sm md:text-base text-gray-600">View and manage your uploaded PDFs</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPDFs}
                    disabled={isLoading}
                    className="h-10 md:h-12 hover:bg-brand-50 hover:text-brand-600 w-full md:w-auto"
                  >
                    <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm md:text-base">Refresh</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/upload')}
                    className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full md:w-auto"
                  >
                    <Upload className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    <span className="text-sm md:text-base">Upload PDF</span>
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
              </div>
            ) : !Array.isArray(pdfs) || pdfs.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No PDFs found</h3>
                  <p className="text-gray-600 text-center mb-6 text-sm md:text-base">
                    Upload your first PDF to get started
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/upload')}
                    className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Upload className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    <span className="text-sm md:text-base">Upload PDF</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {pdfs.map((pdf) => (
                  <Card 
                    key={pdf.id} 
                    className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200"
                  >
                    <CardHeader className="p-4 md:p-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                          <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div className="overflow-hidden">
                          <CardTitle className="text-base md:text-lg truncate">
                            {pdf.title}
                          </CardTitle>
                          <CardDescription className="text-xs md:text-sm">
                            Uploaded on {format(new Date(pdf.uploaded_at), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-end space-x-2 p-4 md:p-6 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDownload(pdf.id, pdf.title, e)}
                        className="h-8 md:h-9 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">Download</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(pdf.id, e)}
                        className="h-8 md:h-9"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">Delete</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PDFList;
