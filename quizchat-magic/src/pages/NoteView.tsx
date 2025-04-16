import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { learningService } from '@/services/learning';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  content: string;
  pdf_name: string;
  created_at: string;
}

const NoteView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await learningService.getNote(id);
        setNote(response);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const downloadNote = () => {
    if (!note) return;

    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${note.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !note) {
    return (
      <MainLayout>
        <div className="text-center p-8 text-red-500">
          {error || 'Note not found'}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="flex items-center"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={downloadNote}>
            <Download className="h-4 w-4 mr-2" />
            Download Note
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Note from {note.pdf_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {formatDistanceToNow(new Date(note.created_at))} ago
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {note.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default NoteView; 