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
  Brain,
  Repeat
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
  const { flashcards, addFlashCard, deleteFlashCard, getFlashcardsByPDF, updateFlashcardLastViewed } = useLearning();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get PDF ID and flashcard ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pdfId = params.get('pdfId');
    const flashcardId = params.get('flashcard');
    
    // Check for YouTube-generated flashcards
    if (location.state?.fromYouTube && location.state?.flashcardsData) {
      const youtubeFlashcards = location.state.flashcardsData;
      // Add each flashcard to the state
      youtubeFlashcards.cards.forEach((card: any) => {
        addFlashCard({
          pdfId: 'youtube',
          front: card.front,
          back: card.back,
        });
      });
      
      toast({
        title: "Flashcards Added",
        description: `${youtubeFlashcards.cards.length} flashcards have been added to your collection.`,
      });
    }
    
    if (pdfId && pdfs.find(p => p.id === pdfId)) {
      setSelectedPdfId(pdfId);
      
      // If a specific flashcard is requested, find its index
      if (flashcardId) {
        const filteredCards = getFlashcardsByPDF(pdfId);
        const cardIndex = filteredCards.findIndex(card => card.id === flashcardId);
        if (cardIndex !== -1) {
          setActiveCardIndex(cardIndex);
          updateFlashcardLastViewed(flashcardId);
        }
      }
    } else if (pdfs.length > 0 && !selectedPdfId) {
      setSelectedPdfId(pdfs[0].id);
    }
  }, [location.search, location.state, pdfs, selectedPdfId, getFlashcardsByPDF, updateFlashcardLastViewed, addFlashCard, toast]);
  
  // Get flashcards for the selected PDF, sorted by most recent first
  const filteredFlashcards = selectedPdfId 
    ? getFlashcardsByPDF(selectedPdfId).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
    deleteFlashCard(flashcard.id);
    
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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Smart Flashcards
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create and study flashcards with AI-powered content generation
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Flashcards</h2>
                    <p className="text-gray-600">Select a PDF and generate or create flashcards</p>
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
                
                <Dialog>
                  <DialogTrigger asChild>
                          <Button className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                            <Wand2 className="h-5 w-5 mr-2" />
                      Generate
                    </Button>
                  </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Generate Flashcards</DialogTitle>
                            <DialogDescription className="text-base">
                              Choose the number of flashcards to generate
                      </DialogDescription>
                    </DialogHeader>
                    
                          <div className="py-6">
                      <div className="space-y-2">
                              <Label className="text-base font-medium">Number of Flashcards</Label>
                        <Select 
                          value={numFlashcards.toString()} 
                          onValueChange={(value) => setNumFlashcards(parseInt(value))}
                        >
                                <SelectTrigger className="h-12">
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
                              className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600"
                      >
                        {isGenerating ? (
                          <>
                                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                                  <Wand2 className="h-5 w-5 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                          <Button className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                            <Plus className="h-5 w-5 mr-2" />
                  New Flashcard
                </Button>
              </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Create New Flashcard</DialogTitle>
                            <DialogDescription className="text-base">
                    Add a new flashcard to your collection
                  </DialogDescription>
                </DialogHeader>
                
                          <div className="space-y-4 py-6">
                  <div className="space-y-2">
                              <Label className="text-base font-medium">Front</Label>
                    <Textarea
                      placeholder="Enter the question or prompt"
                      value={newCardFront}
                      onChange={(e) => setNewCardFront(e.target.value)}
                                className="min-h-[100px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                              <Label className="text-base font-medium">Back</Label>
                    <Textarea
                      placeholder="Enter the answer or explanation"
                      value={newCardBack}
                      onChange={(e) => setNewCardBack(e.target.value)}
                                className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                            <Button 
                              onClick={handleNewCardSubmit}
                              className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600"
                            >
                              Create Flashcard
                            </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
        
        {selectedPdfId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudyMode(!studyMode)}
                    className="h-10 hover:bg-brand-50 hover:text-brand-600"
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
                        className="h-10 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
            
            {filteredFlashcards.length === 0 ? (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Brain className="h-16 w-16 text-brand-500 mb-4" />
                      <h3 className="text-2xl font-bold mb-2">No flashcards yet</h3>
                      <p className="text-gray-600 text-center max-w-md">
                        Create your first flashcard or generate them from your PDF content
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-8">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 relative overflow-hidden group w-full max-w-3xl">
                  <CardContent className="p-12 min-h-[400px] flex items-center justify-center">
                    <div 
                      className={`transition-all duration-500 transform perspective-1000 w-full ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                      onClick={handleCardFlip}
                    >
                      <div className={`${isFlipped ? 'hidden' : 'block'} backface-hidden`}>
                        <h3 className="text-xl font-medium mb-6 text-brand-600">Front</h3>
                        <p className="text-2xl leading-relaxed">{filteredFlashcards[activeCardIndex].front}</p>
                      </div>
                      <div className={`${!isFlipped ? 'hidden' : 'block'} backface-hidden`}>
                        <h3 className="text-xl font-medium mb-6 text-brand-600">Back</h3>
                        <p className="text-2xl leading-relaxed">{filteredFlashcards[activeCardIndex].back}</p>
                      </div>
                    </div>
                  </CardContent>
                  {!studyMode && (
                    <CardFooter className="flex justify-end p-4 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCard(activeCardIndex)}
                        className="h-10 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                <div className="flex flex-col items-center space-y-6 w-full">
                  <div className="flex items-center justify-center space-x-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={prevCard}
                      disabled={activeCardIndex === 0}
                      className="h-20 w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                    >
                      <ChevronLeft className="h-10 w-10" />
                    </Button>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-brand-600">
                        {activeCardIndex + 1}
                      </span>
                      <span className="text-gray-400 mx-2">/</span>
                      <span className="text-3xl font-bold text-gray-600">
                        {filteredFlashcards.length}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={nextCard}
                      disabled={activeCardIndex === filteredFlashcards.length - 1}
                      className="h-20 w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                    >
                      <ChevronRight className="h-10 w-10" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCardFlip}
                    className="h-14 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Repeat className="h-6 w-6 mr-2" />
                    Flip Card
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Flashcards;
