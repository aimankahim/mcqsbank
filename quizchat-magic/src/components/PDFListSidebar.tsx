import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFDocument {
  id: string;
  name: string;
  created_at: string;
}

const PDFListSidebar: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdfs/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDFs');
      }
      
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDFs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (pdfId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdfs/${pdfId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete PDF');
      }
      
      toast({
        title: "Success",
        description: "PDF deleted successfully",
      });
      
      // Refresh the list
      fetchPDFs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 h-full border-r p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r p-4">
      <h2 className="text-lg font-semibold mb-4">Your PDFs</h2>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {pdfs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No PDFs uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm truncate max-w-[150px]">{pdf.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(pdf.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PDFListSidebar; 