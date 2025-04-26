import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileUp, FileText, CheckCircle2, X } from 'lucide-react';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addPDF } = usePDF();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'application/pdf') {
      setFile(files[0]);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      const pdfId = await addPDF(file);
      setProgress(100);
      
      setTimeout(() => {
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`,
        });
        navigate('/');
      }, 500);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };
  
  const cancelUpload = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              
              {!file ? (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">
                    Drag & Drop your PDF here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  
                  <Button onClick={handleUploadButtonClick}>
                    Browse Files
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-brand-600" />
                  </div>
                  
                  <h3 className="text-lg font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  
                  {isUploading ? (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {progress === 100 ? 'Processing...' : `Uploading: ${progress}%`}
                      </p>
                    </div>
                  ) : (
                    <div className="flex space-x-2 justify-center">
                      <Button onClick={handleUpload}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      
                      <Button variant="outline" onClick={cancelUpload}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
