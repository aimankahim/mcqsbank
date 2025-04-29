import React, { createContext, useContext, useState, useEffect } from 'react';
import { pdfService } from '../services/pdfService';
import { PDF } from '../services/pdfService';

interface PDFContextType {
  pdfs: PDF[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  refreshPDFs: () => Promise<void>;
  uploadPDF: (file: File) => Promise<string>;
  deletePDF: (pdfId: string) => Promise<void>;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfs, setPDFs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPDFs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPDFs = await pdfService.getPDFs();
      setPDFs(fetchedPDFs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  const uploadPDF = async (file: File): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const pdfId = await pdfService.uploadPDF(file);
      await refreshPDFs(); // Refresh the list after successful upload
      return pdfId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePDF = async (pdfId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await pdfService.deletePDF(pdfId);
      await refreshPDFs(); // Refresh the list after successful deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPDFs();
  }, []);

  return (
    <PDFContext.Provider value={{ pdfs, loading, isLoading: loading, error, refreshPDFs, uploadPDF, deletePDF }}>
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
