import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/ChatInterface';
import { usePDF } from '@/contexts/PDFContext';

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
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Chat with PDF</h1>
        <ChatInterface />
      </div>
    </MainLayout>
  );
};

export default Chat;
