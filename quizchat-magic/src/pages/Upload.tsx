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
          {/* Hero Section - Responsive */}
          <div className="text-center mb-8 md:mb-12 space-y-2 md:space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Upload PDF
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Upload your PDF document to start learning with AI-powered tools
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Header Section - Responsive */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/pdfs')}
                    className="h-10 md:h-12 hover:bg-brand-50 hover:text-brand-600"
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    <span className="hidden sm:inline">Back to PDFs</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">Upload Document</h3>
                    <p className="text-sm md:text-base text-gray-600">Add a new PDF to your library</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Area - Responsive */}
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
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
                <div className={`h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-4 md:mb-6 transition-transform duration-200 ${dragActive ? 'scale-110' : ''}`}>
                  <UploadIcon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 text-center">
                  {dragActive ? 'Drop your PDF here' : 'Upload your PDF'}
                </h3>
                <p className="text-sm md:text-base text-gray-600 text-center mb-4 md:mb-6 max-w-md">
                  {window.innerWidth < 768 
                    ? 'Tap to select a PDF file' 
                    : 'Drag and drop your PDF here, or click the button below to select a file'}
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
                  className={`h-11 md:h-12 ${
                    isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                  } transition-all duration-200 w-full sm:w-auto`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      {window.innerWidth < 768 ? 'Select PDF' : 'Choose PDF File'}
                    </>
                  )}
                </Button>
                <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
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
