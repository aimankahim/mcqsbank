import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { learningService } from '@/services/learning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, RefreshCw, Download } from 'lucide-react';

const Notes: React.FC = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const { pdfs, isLoading } = usePDF();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePdfChange = (pdfId: string) => {
    setSelectedPdfId(pdfId);
    setNotes(null);
  };

  const generateNotes = async () => {
    if (!selectedPdfId) {
      toast({
        title: "No PDF selected",
        description: "Please select a PDF first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await learningService.generateNotes({
        pdf_id: selectedPdfId,
      });
      
      setNotes(response.notes);

      // Save the note
      await learningService.saveNote({
        title: `Notes for PDF ${selectedPdfId}`,
        content: response.notes,
        source_text: '',
      });

      toast({
        title: "Notes generated",
        description: "Your concise notes have been generated and saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadNotes = () => {
    if (!notes) return;

    const blob = new Blob([notes], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'concise-notes.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Concise Notes</h1>
            <p className="text-muted-foreground">
              Generate concise and well-organized notes from your PDFs
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Notes</CardTitle>
              <CardDescription>
                Select a PDF to generate concise notes from its content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                  ) : pdfs.length > 0 ? (
                    <Select value={selectedPdfId || ""} onValueChange={handlePdfChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a PDF" />
                      </SelectTrigger>
                      <SelectContent>
                        {pdfs.map((pdf) => (
                          <SelectItem key={pdf.id} value={pdf.id}>
                            {pdf.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="flex items-center" 
                      onClick={() => navigate('/upload')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload PDF
                    </Button>
                  )}
                </div>

                <Button
                  onClick={generateNotes}
                  disabled={isGenerating || !selectedPdfId}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Notes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Notes</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadNotes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{notes}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notes; 