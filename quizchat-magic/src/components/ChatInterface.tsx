import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, File } from "lucide-react";
import { chatService } from '@/services/chatService';
import { pdfService } from '@/services/pdfService';
import { PDF } from '@/services/pdfService';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoadingPDFs, setIsLoadingPDFs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Load PDFs and check URL for initial PDF
  useEffect(() => {
    const loadPDFs = async () => {
      try {
        setIsLoadingPDFs(true);
        const loadedPDFs = await pdfService.getPDFs();
        setPdfs(loadedPDFs);

        const params = new URLSearchParams(location.search);
        const urlPdfId = params.get('pdf');
        if (urlPdfId && loadedPDFs.some(pdf => pdf.id === urlPdfId)) {
          setPdfId(urlPdfId);
          setMessages([{
            role: 'assistant',
            content: 'PDF loaded successfully! You can now ask questions about its content.'
          }]);
        }
      } catch (error) {
        console.error('Failed to load PDFs:', error);
        toast({
          title: "Error",
          description: "Failed to load your PDF documents",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPDFs(false);
      }
    };

    loadPDFs();
  }, [location.search, toast]);

  const handlePDFSelect = (selectedId: string) => {
    setPdfId(selectedId);
    window.history.pushState({}, '', `/chat?pdf=${selectedId}`);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'PDF changed successfully! You can now ask questions about the new document.'
    }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const newPDF = await pdfService.uploadPDF(file);
      const updatedPDFs = await pdfService.getPDFs();
      setPdfs(updatedPDFs);
      handlePDFSelect(newPDF.id);
      toast({
        title: "Success",
        description: "PDF uploaded and processed successfully",
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    if (!pdfId) {
      toast({
        title: "Error",
        description: "Please select a PDF first",
        variant: "destructive",
      });
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage(userMessage, pdfId);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] max-w-4xl mx-auto p-2 md:p-4">
      {/* PDF Selection and Upload */}
      <div className="flex flex-col md:flex-row items-center gap-2 mb-4 w-full">
        <Select
          value={pdfId || ''}
          onValueChange={handlePDFSelect}
          disabled={isLoadingPDFs || isUploading}
        >
          <SelectTrigger className="w-full md:flex-1">
            <SelectValue placeholder={isLoadingPDFs ? "Loading PDFs..." : "Select a PDF"} />
          </SelectTrigger>
          <SelectContent>
            {pdfs.map(pdf => (
              <SelectItem key={pdf.id} value={pdf.id}>
                {pdf.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full md:w-auto"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </>
          )}
        </Button>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 p-4 mb-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <File className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {isLoadingPDFs ? 'Loading your documents...' : 'Select a PDF to start chatting'}
                </h3>
                <p className="max-w-sm mb-4">
                  Choose from your existing PDFs or upload a new one to ask questions about its content.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[90%] md:max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping || !pdfId}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isTyping || !pdfId}
          size="sm"
          className="h-10"
        >
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </div>
  );
}
