import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon } from 'lucide-react';
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
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload PDF</h1>
          <p className="text-muted-foreground">
            Upload a PDF document to start learning from it.
          </p>
        </div>
        
        <Card
          className={`border-2 border-dashed ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
              onDragEnter={handleDrag}
          onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UploadIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Drag and drop your PDF here, or click to select a file
            </p>
              <Input
              ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
              className="hidden"
            />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
              {isUploading ? "Uploading..." : "Select PDF"}
                </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Upload;
