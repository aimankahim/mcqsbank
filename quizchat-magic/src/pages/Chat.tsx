import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/ChatInterface';
import { usePDF } from '@/contexts/PDFContext';
import { MessageSquare, Sparkles } from 'lucide-react';

const Chat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getPDFById } = usePDF();
  
  useEffect(() => {
    // Get PDF ID from URL if present
    const params = new URLSearchParams(location.search);
    const pdfId = params.get('pdf');
    
    if (pdfId) {
      // Verify that the PDF exists in our context
      const pdf = getPDFById(pdfId);
      if (!pdf) {
        // If PDF doesn't exist, redirect to upload page
        navigate('/upload', { 
          replace: true,
          state: { error: 'PDF not found. Please upload a PDF first.' }
        });
      }
    }
  }, [location, navigate, getPDFById]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <div className="inline-block">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-brand-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                AI Chat Assistant
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-brand-600 to-purple-600 mx-auto mt-2 rounded-full"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Have a conversation with your PDF content using advanced AI
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300 border border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg transform hover:rotate-3 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Chat Interface</h2>
                  <p className="text-gray-600 text-lg">Ask questions and get instant answers about your PDF content</p>
                </div>
                <div className="ml-auto">
                  <div className="flex items-center space-x-2 text-brand-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Powered by AI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 transform hover:scale-[1.01] transition-transform duration-300">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
