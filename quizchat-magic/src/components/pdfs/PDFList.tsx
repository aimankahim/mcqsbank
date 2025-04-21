import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface PDF {
  id: string;
  file_name: string;
  created_at: string;
}

const PDFList: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPDFs = async () => {
    try {
      const response = await axios.get('/api/upload-pdf/');
      setPdfs(response.data);
    } catch (error) {
      toast.error('Failed to fetch PDFs');
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pdfId: string) => {
    try {
      await axios.delete(`/api/upload-pdf/${pdfId}/`);
      toast.success('PDF deleted successfully');
      fetchPDFs(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete PDF');
      console.error('Error deleting PDF:', error);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your PDFs</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pdfs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No PDFs found
                </TableCell>
              </TableRow>
            ) : (
              pdfs.map((pdf) => (
                <TableRow key={pdf.id}>
                  <TableCell>{pdf.file_name}</TableCell>
                  <TableCell>{new Date(pdf.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pdf.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PDFList; 