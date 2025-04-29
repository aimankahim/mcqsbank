import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon } from 'lucide-react';
import { usePDF } from '@/contexts/PDFContext';
import { pdfService } from '@/services/pdfService';

const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshPDFs } = usePDF();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await pdfService.uploadPDF(file);
      await refreshPDFs();
      toast({
        title: "Success",
        description: "PDF uploaded successfully",
      });
      navigate('/pdfs');
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload PDF</h1>
          <p className="text-muted-foreground">
            Upload a PDF document to start learning from it.
          </p>
        </div>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upload a PDF</CardTitle>
            <CardDescription>
              Upload a PDF file to create flashcards, quizzes, or chat with it.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-brand-400 bg-brand-50' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileInputChange}
              />
              
              <div className="space-y-4">
                <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drag and drop your PDF here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Select PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="list-disc list-inside">
                <li>PDF documents (.pdf)</li>
              </ul>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">What you can do:</p>
              <ul className="list-disc list-inside">
                <li>Chat with your PDF to ask questions about its content</li>
                <li>Create flashcards to help memorize key concepts</li>
                <li>Generate quizzes to test your knowledge</li>
                <li>Create concise notes from the PDF content</li>
              </ul>
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Upload;
