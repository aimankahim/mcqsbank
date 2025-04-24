import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { formatFileSize, formatDate } from '@/utils/format';
import { toast } from 'sonner';
import axios from 'axios';
import MainLayout from '@/components/layout/MainLayout';

interface PDF {
  id: string;
  name: string;
  size: number;
  uploaded_at: number;
}

const PDFManagement: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPDFs = async () => {
    try {
      const response = await axios.get<PDF[]>('/api/pdfs/');
      if (response.data) {
        setPdfs(response.data);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast.error('Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleDelete = async (pdfId: string) => {
    try {
      await axios.delete(`/api/pdfs/${pdfId}/`);
      toast.success('PDF deleted successfully');
      fetchPDFs();
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error('Failed to delete PDF');
    }
  };

  const handleDownload = (pdfId: string, name: string) => {
    window.open(`/api/pdfs/${pdfId}/download/`, '_blank');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">PDF Management</h1>
        <div className="grid gap-4">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
            >
              <div>
                <h3 className="font-medium">{pdf.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(pdf.size)} • Uploaded {formatDate(pdf.uploaded_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(pdf.id, pdf.name)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(pdf.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {pdfs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No PDFs uploaded yet
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PDFManagement; 