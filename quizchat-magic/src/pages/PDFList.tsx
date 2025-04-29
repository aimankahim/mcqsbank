import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Trash2, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { authService } from '@/services/auth';
import { usePDF } from '@/contexts/PDFContext';
import { pdfService } from '@/services/pdfService';

const API_URL = import.meta.env.VITE_API_URL || 'https://django-based-mcq-app.onrender.com';

const PDFList: React.FC = () => {
  const { pdfs, isLoading, refreshPDFs } = usePDF();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCardClick = (pdfId: string) => {
    navigate(`/pdfs/${pdfId}`);
  };

  const handleDelete = async (pdfId: string) => {
    try {
      await pdfService.deletePDF(pdfId);
      await refreshPDFs();
      toast({
        title: "Success",
        description: "PDF deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (pdfId: string, title: string) => {
    try {
      await pdfService.downloadPDF(pdfId, title);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Your PDFs</h1>
            <p className="text-muted-foreground">
              Manage your uploaded PDF documents
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPDFs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : pdfs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No PDFs found</h3>
              <p className="text-muted-foreground text-center">
                Upload your first PDF to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
              <Card 
                key={pdf.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCardClick(pdf.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg truncate">{pdf.title}</CardTitle>
                  <CardDescription>
                    Uploaded on {format(new Date(pdf.uploaded_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(pdf.id, pdf.title);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pdf.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PDFList; 