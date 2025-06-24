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
    
    // Show the newly added card
    setActiveCardIndex(0);
    setIsFlipped(false);
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
          {/* Hero Section - Always visible */}
          <div className="text-center mb-6 md:mb-12 space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Flashcards
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Create and study flashcards with AI-powered content generation
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* PDF Selection and Action Buttons - Fixed at the top */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Icon Container */}
                <div className="flex h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 items-center justify-center">
                  <Brain className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
        
                {/* Text Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Create Flashcards
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Select a PDF and generate or create flashcards
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* PDF Selector/Upload Button */}
                <div className="flex-1 w-full min-w-0">
                  {isLoading ? (
                    <div className="flex justify-center py-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" />
                    </div>
                  ) : pdfs.length > 0 ? (
                    <Select value={selectedPdfId || ""} onValueChange={handlePdfChange}>
                      <SelectTrigger className="w-full h-11 md:h-12 bg-white border-2 border-gray-200 hover:border-brand-400 focus:border-brand-500 transition-colors">
                        <SelectValue placeholder="Select a PDF" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[var(--radix-select-content-available-height)]">
                        {pdfs.map((pdf) => (
                          <SelectItem 
                            key={pdf.id} 
                            value={pdf.id}
                            className="text-base hover:bg-brand-50"
                          >
                            {pdf.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-11 md:h-12 gap-2 border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50"
                      onClick={() => navigate('/upload')}
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload PDF</span>
                    </Button>
                  )}
                </div>
                
                {pdfs.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white text-sm md:text-base w-full md:w-auto">
                          <Wand2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                          Generate
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl md:text-2xl font-bold">Generate Flashcards</DialogTitle>
                          <DialogDescription className="text-sm md:text-base">
                            Choose the number of flashcards to generate
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 md:py-6">
                          <div className="space-y-2">
                            <Label className="text-sm md:text-base font-medium">Number of Flashcards</Label>
                            <Select 
                              value={numFlashcards.toString()} 
                              onValueChange={(value) => setNumFlashcards(parseInt(value))}
                            >
                              <SelectTrigger className="h-10 md:h-12">
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
                            className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white text-sm md:text-base w-full md:w-auto">
                          <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                          New Card
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-xl md:text-2xl font-bold">Create New Flashcard</DialogTitle>
                          <DialogDescription className="text-sm md:text-base">
                            Add a new flashcard to your collection
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleNewCardSubmit} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Textarea
                              placeholder="Enter the question or prompt"
                              value={newCardFront}
                              onChange={(e) => setNewCardFront(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              placeholder="Enter the answer or explanation"
                              value={newCardBack}
                              onChange={(e) => setNewCardBack(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                        </form>
                        <DialogFooter>
                          <Button 
                            type="submit"
                            onClick={handleNewCardSubmit}
                            className="h-10 md:h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600"
                          >
                            Create Flashcard
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
            
            {/* Flashcards Content Area */}
            {selectedPdfId && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStudyMode(!studyMode)}
                    className="h-9 md:h-10 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    {studyMode ? 'Exit Study Mode' : 'Study Mode'}
                  </Button>
                </div>
                
                {filteredFlashcards.length === 0 ? (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                      <Brain className="h-12 md:h-16 w-12 md:w-16 text-brand-500 mb-3 md:mb-4" />
                      <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">No flashcards yet</h3>
                      <p className="text-sm md:text-base text-gray-600 text-center max-w-md">
                        Create your first flashcard or generate them from your PDF content
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8">
                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 relative overflow-hidden group w-full max-w-3xl">
                      <CardContent className="p-4 md:p-8 lg:p-12 min-h-[250px] md:min-h-[350px] lg:min-h-[400px] flex items-center justify-center">
                        <div 
                          className={`transition-all duration-500 transform perspective-1000 w-full ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                          onClick={handleCardFlip}
                        >
                          <div className={`${isFlipped ? 'hidden' : 'block'} backface-hidden`}>
                            <h3 className="text-base md:text-lg lg:text-xl font-medium mb-3 md:mb-4 lg:mb-6 text-brand-600">Question</h3>
                            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed">{filteredFlashcards[activeCardIndex].front}</p>
                          </div>
                          <div className={`${!isFlipped ? 'hidden' : 'block'} backface-hidden`}>
                            <h3 className="text-base md:text-lg lg:text-xl font-medium mb-3 md:mb-4 lg:mb-6 text-brand-600">Answer</h3>
                            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed">{filteredFlashcards[activeCardIndex].back}</p>
                          </div>
                        </div>
                      </CardContent>
                      {!studyMode && (
                        <CardFooter className="flex justify-end p-2 md:p-4 border-t">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCard(activeCardIndex)}
                            className="h-8 md:h-10 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                    
                    <div className="flex flex-col items-center space-y-4 md:space-y-6 w-full">
                      <div className="flex items-center justify-center space-x-4 md:space-x-6 lg:space-x-8">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={prevCard}
                          disabled={activeCardIndex === 0}
                          className="h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                        >
                          <ChevronLeft className="h-6 w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" />
                        </Button>
                        <div className="text-center">
                          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-600">
                            {activeCardIndex + 1}
                          </span>
                          <span className="text-gray-400 mx-1 md:mx-2">/</span>
                          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-600">
                            {filteredFlashcards.length}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={nextCard}
                          disabled={activeCardIndex === filteredFlashcards.length - 1}
                          className="h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 rounded-full hover:bg-brand-50 hover:text-brand-600"
                        >
                          <ChevronRight className="h-6 w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCardFlip}
                        className="h-11 md:h-12 lg:h-14 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Repeat className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 mr-2" />
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
