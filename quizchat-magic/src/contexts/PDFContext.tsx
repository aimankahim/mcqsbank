import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { learningService } from '@/services/learning';

interface PDF {
  id: string;
  name: string;
  createdAt: Date;
}

interface PDFContextType {
  pdfs: PDF[];
  addPDF: (file: File) => Promise<string>;
  deletePDF: (id: string) => void;
  getPDFById: (id: string) => PDF | undefined;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const { toast } = useToast();

  // Load PDFs from localStorage on mount
  useEffect(() => {
    const savedPdfs = localStorage.getItem('pdfs');
    if (savedPdfs) {
      setPdfs(JSON.parse(savedPdfs, (key, value) => {
        if (key === 'createdAt') {
          return new Date(value);
        }
        return value;
      }));
    }
  }, []);

  // Save PDFs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pdfs', JSON.stringify(pdfs));
  }, [pdfs]);

  const addPDF = async (file: File): Promise<string> => {
    try {
      // Upload PDF using the learning service
      const pdfId = await learningService.uploadPDF(file);
      
      // Add PDF to local state
      const newPdf: PDF = {
        id: pdfId,
        name: file.name,
        createdAt: new Date(),
      };
      
      setPdfs(prev => [...prev, newPdf]);
      return pdfId;
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const deletePDF = (id: string) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== id));
    toast({
      title: "PDF removed",
      description: "The PDF has been removed.",
    });
  };

  const getPDFById = (id: string): PDF | undefined => {
    return pdfs.find(pdf => pdf.id === id);
  };

  return (
    <PDFContext.Provider
      value={{
        pdfs,
        addPDF,
        deletePDF,
        getPDFById,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  return context;
};

export default PDFContext;
