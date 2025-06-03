import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { learningService } from '@/services/learning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, RefreshCw, Download, Wand2, Upload } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Smart Notes
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Generate concise and well-organized notes from your PDFs using AI
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Generate Notes</h2>
                    <p className="text-gray-600">Select a PDF to create concise notes</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                  ) : pdfs.length > 0 ? (
                    <>
                      <Select value={selectedPdfId || ""} onValueChange={handlePdfChange}>
                        <SelectTrigger className="w-[250px] h-12 bg-white/50 backdrop-blur-sm border-2 focus:border-brand-500">
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

                      <Button
                        onClick={generateNotes}
                        disabled={isGenerating || !selectedPdfId}
                        className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-5 w-5 mr-2" />
                            Generate Notes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-12 flex items-center space-x-2 border-2 hover:border-brand-500 hover:bg-brand-50"
                      onClick={() => navigate('/upload')}
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload PDF</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Content */}
            {notes && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Generated Notes</CardTitle>
                      <CardDescription className="text-base mt-1">
                        Your AI-generated concise notes
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={downloadNotes}
                      className="h-12 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Notes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/50 p-6 rounded-lg border border-gray-100">
                    <div className="prose prose-lg max-w-none">
                      {notes.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notes; 