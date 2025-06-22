import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/ChatInterface';
import { usePDF } from '@/contexts/PDFContext';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Chat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getPDFById } = usePDF();
  const { toast } = useToast();
  
  useEffect(() => {
    // Get PDF ID from URL if present
    const params = new URLSearchParams(location.search);
    const pdfId = params.get('pdf');
    
    if (pdfId) {
      // Verify that the PDF exists in our context
      const pdf = getPDFById(pdfId);
      if (!pdf) {
        toast({
          title: "PDF not found",
          description: "Please upload the PDF first to chat with it.",
          variant: "destructive",
        });
        navigate('/upload', { 
          replace: true,
          state: { error: 'PDF not found. Please upload a PDF first.' }
        });
      }
    }
  }, [location, navigate, getPDFById, toast]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12 space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Chatbot
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Chat with your documents and get instant answers using AI
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Chat Interface</h2>
                    <p className="text-sm md:text-base text-gray-600">Ask questions about your document</p>
                  </div>
                </div>
                
                {/* Right-aligned "Powered by AI" section */}
                <div className="ml-auto">
                  <div className="flex items-center space-x-2 text-brand-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium text-sm md:text-base">Powered by AI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
