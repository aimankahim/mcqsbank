import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import { chatService } from '@/services/chatService';
import { usePDF } from '@/contexts/PDFContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { addPDF, getPDFById } = usePDF();

  // Get PDF ID from URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPdfId = params.get('pdf');
    if (urlPdfId) {
      const pdf = getPDFById(urlPdfId);
      if (pdf) {
        setPdfId(urlPdfId);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'PDF loaded successfully! You can now ask questions about its content.'
        }]);
      } else {
        // If PDF doesn't exist in context, clear the ID
        setPdfId(null);
        navigate('/chat', { replace: true });
      }
    }
  }, [location, getPDFById, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
    setIsUploading(true);
    
    try {
      // First, upload to chat service
      const chatPdfId = await chatService.uploadPDF(file);
      
      // Then, add to PDF context
      await addPDF(file);
      
      setPdfId(chatPdfId);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'PDF uploaded and processed successfully! You can now ask questions about its content.'
      }]);
      
      toast({
        title: "Success",
        description: "PDF uploaded and processed successfully",
      });

      // Update URL without full navigation
      window.history.pushState({}, '', `/chat?pdf=${chatPdfId}`);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload PDF. Please try again.";
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to upload PDF: ${errorMessage}`
      }]);
      
      setSelectedFile(null);
      setPdfId(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !pdfId) {
      toast({
        title: "Error",
        description: !pdfId ? "Please upload a PDF first" : "Please enter a message",
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
      const errorMessage = error instanceof Error ? error.message : "Failed to get response. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error: ' + errorMessage
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <Card className="flex-1 p-4 mb-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Upload className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload a PDF to start chatting</h3>
                <p className="max-w-sm mb-4">
                  Upload a PDF document and ask questions about its content. I'll help you understand and analyze the document.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
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
            {(isUploading || isTyping) && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isUploading ? 'Uploading PDF...' : 'AI is typing...'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="flex-1"
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
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping || !pdfId}
          />
          <Button type="submit" disabled={isTyping || !pdfId}>
            {isTyping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 