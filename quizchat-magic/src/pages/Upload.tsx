import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, ArrowLeft } from 'lucide-react';
import { pdfService } from '@/services/pdfService';

const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      toast({
        title: "Success",
        description: "PDF uploaded successfully",
      });
      navigate('/pdfs');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Upload PDF
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your PDF document to start learning with AI-powered tools
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
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
                    <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                    <p className="text-gray-600">Add a new PDF to your library</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <Card
              className={`bg-white/80 backdrop-blur-sm shadow-lg border-2 border-dashed transition-all duration-200 ${
                dragActive 
                  ? 'border-brand-500 bg-brand-50/50 scale-[1.02]' 
                  : 'border-gray-200 hover:border-brand-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-6 transition-transform duration-200 ${dragActive ? 'scale-110' : ''}`}>
                  <UploadIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {dragActive ? 'Drop your PDF here' : 'Upload your PDF'}
                </h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Drag and drop your PDF here, or click the button below to select a file
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`h-12 ${
                    isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                  } transition-all duration-200`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Select PDF
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Supported format: PDF
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Upload;
