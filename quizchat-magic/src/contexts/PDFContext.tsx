import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  getPDFById: (id: string) => PDF | undefined;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfs, setPDFs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPDFs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPDFs = await pdfService.getPDFs();
      setPDFs(prevPDFs => {
        // Only update if the PDFs have actually changed
        if (JSON.stringify(prevPDFs) !== JSON.stringify(fetchedPDFs)) {
          return fetchedPDFs;
        }
        return prevPDFs;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPDF = useCallback(async (file: File): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const pdfId = await pdfService.uploadPDF(file);
      
      // Immediately refresh the PDFs list
      await refreshPDFs();
      
      // Return the PDF ID for immediate use
      return pdfId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPDFs]);

  const deletePDF = useCallback(async (pdfId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await pdfService.deletePDF(pdfId);
      await refreshPDFs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPDFs]);

  const getPDFById = useCallback((id: string): PDF | undefined => {
    return pdfs.find(pdf => pdf.id === id);
  }, [pdfs]);

  // Initial load of PDFs
  useEffect(() => {
    refreshPDFs();
  }, [refreshPDFs]);

  // Set up periodic refresh of PDFs
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshPDFs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [refreshPDFs]);

  const contextValue = React.useMemo(() => ({
    pdfs,
    loading,
    isLoading: loading,
    error,
    refreshPDFs,
    uploadPDF,
    deletePDF,
    getPDFById
  }), [pdfs, loading, error, refreshPDFs, uploadPDF, deletePDF, getPDFById]);

  return (
    <PDFContext.Provider value={contextValue}>
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
