import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { learningService } from '@/services/learning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, RefreshCw, Download, Wand2, Upload, ChevronDown, ChevronUp } from 'lucide-react';

const Notes: React.FC = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const { pdfs, isLoading } = usePDF();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePdfChange = (pdfId: string) => {
    setSelectedPdfId(pdfId);
    setNotes(null);
    setExpandedSections({});
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
      // Initialize all sections as expanded
      const sections = response.notes.split('\n\n');
      const initialExpandedState = sections.reduce((acc, _, index) => {
        acc[index] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setExpandedSections(initialExpandedState);

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
    a.download = `notes-${selectedPdfId}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

const formatNoteContent = (content: string) => {
  const lines = content.split('\n');
  let inList = false;
  let listDepth = 0;
  const listStack: Array<'ul' | 'ol'> = [];

  return lines.map((line, i) => {
    // Skip empty lines
    if (!line.trim()) return null;

    // Detect markdown headings
    const headingMatch = line.match(/^(#+)\s*(.*)/);
    if (headingMatch) {
      const [_, hashes, text] = headingMatch;
      const level = Math.min(hashes.length, 6);
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return <HeadingTag key={i} className={`text-brand-700 font-semibold mt-4 mb-2`}>{text}</HeadingTag>;
    }

    // Detect list items (supports -, •, *, and numbered lists)
    const listItemMatch = line.match(/^(\s*)([-•*]|\d+\.)\s+(.*)/);
    const isListItem = !!listItemMatch;

    if (isListItem) {
      const [_, indent, marker, text] = listItemMatch;
      const currentDepth = indent ? Math.floor(indent.length / 2) : 0;
      const isOrdered = !isNaN(parseInt(marker));
      const currentListType = isOrdered ? 'ol' : 'ul';

      // Handle list depth changes
      const elements = [];
      
      // Close lists if we're moving up in depth
      while (currentDepth < listDepth) {
        listDepth--;
        listStack.pop();
      }
      
      // Open new list if we're moving down in depth or list type changed
      if (currentDepth > listDepth || 
          (listStack.length > 0 && listStack[listStack.length - 1] !== currentListType)) {
        listDepth = currentDepth;
        listStack.push(currentListType);
      }

      // Calculate margin based on depth
      const marginLeft = `${(currentDepth + 1) * 1}rem`; // Using rem units for consistent spacing

      return (
        <li 
          key={i} 
          className={`${isOrdered ? 'list-decimal' : 'list-disc'}`}
          style={{ marginLeft }}
        >
          {text}
        </li>
      );
    } else {
      // Not a list item - close any open lists
      if (inList) {
        inList = false;
        listDepth = 0;
        listStack.length = 0;
      }

      // Regular paragraph (lines starting with * will be treated as normal text if not followed by space)
      return (
        <p key={i} className="text-gray-700 mb-2 whitespace-pre-wrap">
          {line}
        </p>
      );
    }
  }).filter(Boolean);
};

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12 space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
             AI-Powered Notes
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Generate concise and well-organized notes from your PDFs using AI
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Control Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Generate Notes</h2>
                    <p className="text-sm md:text-base text-gray-600">Select a PDF to create concise notes</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 self-center"></div>
                  ) : pdfs.length > 0 ? (
                    <>
                      <Select value={selectedPdfId || ""} onValueChange={handlePdfChange}>
                        <SelectTrigger className="w-full md:w-[250px] h-12 bg-white/50 backdrop-blur-sm border-2 focus:border-brand-500">
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
                            <span className="hidden md:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-5 w-5 mr-2" />
                            <span>Generate Notes</span>
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-12 flex items-center justify-center space-x-2 border-2 hover:border-brand-500 hover:bg-brand-50"
                      onClick={() => navigate('/upload')}
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload PDF</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Display Section */}
            {notes && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">Generated Notes</CardTitle>
                      <CardDescription className="text-sm md:text-base mt-1">
                        {pdfs.find(pdf => pdf.id === selectedPdfId)?.title || 'Document'} • {new Date().toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={downloadNotes}
                        className="h-12 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/50 p-4 md:p-6 rounded-lg border border-gray-100">
                    <div className="space-y-4">
                      {notes.split('\n\n').map((section, sectionIndex) => {
                        if (!section.trim()) return null;
                        
                        const isHeading = /^#/.test(section.trim());
                        const isList = /^(\s*)([-•*]|\d+\.)\s+/m.test(section);

                        return (
                          <div key={sectionIndex} className="mb-4">
                            {isHeading ? (
                              <div 
                                className="flex items-center cursor-pointer group"
                                onClick={() => toggleSection(sectionIndex)}
                              >
                                {formatNoteContent(section)}
                                <span className="ml-2 text-brand-500">
                                  {expandedSections[sectionIndex] ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className={`${expandedSections[sectionIndex] === false ? 'hidden' : ''}`}>
                                {isList ? (
                                  <div className="pl-5">
                                    {formatNoteContent(section)}
                                  </div>
                                ) : (
                                  formatNoteContent(section)
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
