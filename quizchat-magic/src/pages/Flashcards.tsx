import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { useLearning } from '@/contexts/LearningContext';
import { learningService } from '@/services/learning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Plus, 
  RefreshCw, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Wand2,
  Upload,
  Brain
} from 'lucide-react';
import { Label } from '@/components/ui/label';

const Flashcards: React.FC = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<boolean>(false);
  const [newCardFront, setNewCardFront] = useState<string>('');
  const [newCardBack, setNewCardBack] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [numFlashcards, setNumFlashcards] = useState<number>(5);
  
  const { pdfs, isLoading } = usePDF();
  const { flashcards, addFlashCard, deleteFlashCard, getFlashcardsByPDF } = useLearning();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get PDF ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pdfId = params.get('pdfId');
    
    if (pdfId && pdfs.find(p => p.id === pdfId)) {
      setSelectedPdfId(pdfId);
    } else if (pdfs.length > 0 && !selectedPdfId) {
      setSelectedPdfId(pdfs[0].id);
    }
  }, [location.search, pdfs, selectedPdfId]);
  
  // Get flashcards for the selected PDF
  const filteredFlashcards = selectedPdfId 
    ? getFlashcardsByPDF(selectedPdfId)
    : [];
  
  const handlePdfChange = (pdfId: string) => {
    setSelectedPdfId(pdfId);
    setActiveCardIndex(0);
    setIsFlipped(false);
    
    // Update URL without navigating
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('pdfId', pdfId);
    const newUrl = `${location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  };
  
  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  const nextCard = () => {
    if (activeCardIndex < filteredFlashcards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
      setIsFlipped(false);
    }
  };
  
  const prevCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
      setIsFlipped(false);
    }
  };
  
  const handleNewCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPdfId || !newCardFront.trim() || !newCardBack.trim()) {
      toast({
        title: "Invalid input",
        description: "Please fill in both sides of the flashcard.",
        variant: "destructive",
      });
      return;
    }
    
    addFlashCard({
      pdfId: selectedPdfId,
      front: newCardFront,
      back: newCardBack,
    });
    
    setNewCardFront('');
    setNewCardBack('');
    
    toast({
      title: "Flashcard added",
      description: "Your flashcard has been created.",
    });
  };
  
  const handleDeleteCard = (index: number) => {
    if (!selectedPdfId) return;
    
    const flashcard = filteredFlashcards[index];
    deleteFlashCard(selectedPdfId, flashcard.id);
    
    if (activeCardIndex >= filteredFlashcards.length - 1) {
      setActiveCardIndex(Math.max(0, filteredFlashcards.length - 2));
    }
    
    toast({
      title: "Flashcard deleted",
      description: "The flashcard has been removed.",
    });
  };
  
  const generateFlashcards = async () => {
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
      const response = await learningService.generateFlashcards({
        pdf_id: selectedPdfId,
        num_items: numFlashcards
      });
      
      // Add each generated flashcard
      response.flashcards.forEach(card => {
        addFlashCard({
          pdfId: selectedPdfId,
          front: card.question,
          back: card.answer,
        });
      });
      
      toast({
        title: "Flashcards generated",
        description: `${response.flashcards.length} flashcards have been created.`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate flashcards.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground">
              Create and study flashcards from your PDFs
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
            ) : pdfs.length > 0 ? (
              <>
                <Select value={selectedPdfId || ""} onValueChange={handlePdfChange}>
                  <SelectTrigger className="w-[250px]">
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
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Flashcards</DialogTitle>
                      <DialogDescription>
                        Generate flashcards from your PDF content
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Number of Flashcards</Label>
                        <Select 
                          value={numFlashcards.toString()} 
                          onValueChange={(value) => setNumFlashcards(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of flashcards" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 flashcards</SelectItem>
                            <SelectItem value="10">10 flashcards</SelectItem>
                            <SelectItem value="15">15 flashcards</SelectItem>
                            <SelectItem value="20">20 flashcards</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        onClick={generateFlashcards}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="flex items-center" 
                onClick={() => navigate('/upload')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Flashcard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flashcard</DialogTitle>
                  <DialogDescription>
                    Add a new flashcard to your collection
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Front</Label>
                    <Textarea
                      placeholder="Enter the question or prompt"
                      value={newCardFront}
                      onChange={(e) => setNewCardFront(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Back</Label>
                    <Textarea
                      placeholder="Enter the answer or explanation"
                      value={newCardBack}
                      onChange={(e) => setNewCardBack(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleNewCardSubmit}>Create Flashcard</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {selectedPdfId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudyMode(!studyMode)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {studyMode ? 'Exit Study Mode' : 'Study Mode'}
              </Button>
              
              {filteredFlashcards.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveCardIndex(0);
                      setIsFlipped(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
            
            {filteredFlashcards.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No flashcards yet</h3>
                  <p className="text-muted-foreground text-center">
                    Create your first flashcard or generate them from your PDF
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="relative">
                  <CardContent className="p-6">
                    <div 
                      className={`transition-transform duration-500 transform ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                      onClick={handleCardFlip}
                    >
                      <div className={`${isFlipped ? 'hidden' : ''}`}>
                        <h3 className="text-lg font-medium mb-4">Front</h3>
                        <p className="text-lg">{filteredFlashcards[activeCardIndex].front}</p>
                      </div>
                      <div className={`${!isFlipped ? 'hidden' : ''}`}>
                        <h3 className="text-lg font-medium mb-4">Back</h3>
                        <p className="text-lg">{filteredFlashcards[activeCardIndex].back}</p>
                      </div>
                    </div>
                  </CardContent>
                  
                  {!studyMode && (
                    <CardFooter className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCard(activeCardIndex)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={prevCard}
                    disabled={activeCardIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <span className="text-lg font-medium">
                    {activeCardIndex + 1} / {filteredFlashcards.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={nextCard}
                    disabled={activeCardIndex === filteredFlashcards.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Flashcards;
