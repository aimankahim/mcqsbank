import React, { createContext, useContext, useState, useEffect } from 'react';
import { pdfService, PDF } from '@/services/pdfService';
import { useToast } from '@/hooks/use-toast';

interface PDFContextType {
  pdfs: PDF[];
  isLoading: boolean;
  refreshPDFs: () => Promise<void>;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshPDFs = async () => {
    try {
      setIsLoading(true);
      const fetchedPDFs = await pdfService.getPDFs();
      setPdfs(fetchedPDFs);
    } catch (error) {
      console.error('Error refreshing PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch PDFs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPDFs();
  }, []);

  return (
    <PDFContext.Provider value={{ pdfs, isLoading, refreshPDFs }}>
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
