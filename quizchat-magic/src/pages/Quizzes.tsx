import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { learningService } from '@/services/learning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle } from "lucide-react";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Upload, 
  ScrollText,
  Wand2
} from 'lucide-react';

interface QuizState {
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
  }>;
  currentQuestionIndex: number;
  answers: string[];
  showResults: boolean;
}

const Quizzes: React.FC = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  
  const { pdfs, isLoading } = usePDF();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePdfChange = (pdfId: string) => {
    setSelectedPdfId(pdfId);
    setQuizState(null);
  };

  const generateQuiz = async () => {
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
      const response = await learningService.generateQuiz({
        pdf_id: selectedPdfId,
        num_items: numQuestions,
        difficulty: 'medium'
      });
      
      setQuizState({
        questions: response.questions,
        currentQuestionIndex: 0,
        answers: new Array(response.questions.length).fill(''),
        showResults: false,
      });

      toast({
        title: "Quiz generated",
        description: `${response.questions.length} questions have been generated.`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!quizState) return;

    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestionIndex] = answer;

    setQuizState({
      ...quizState,
      answers: newAnswers,
    });
  };

  const nextQuestion = () => {
    if (!quizState) return;
    
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
      });
    } else {
      setQuizState({
        ...quizState,
        showResults: true,
      });
    }
  };

  const prevQuestion = () => {
    if (!quizState) return;
    
    if (quizState.currentQuestionIndex > 0) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex - 1,
      });
    }
  };

  const resetQuiz = () => {
    if (!quizState) return;
    
    setQuizState({
      ...quizState,
      currentQuestionIndex: 0,
      answers: new Array(quizState.questions.length).fill(''),
      showResults: false,
    });
  };

  const calculateScore = () => {
    if (!quizState) return 0;
    
    return quizState.answers.reduce((score, answer, index) => {
      return answer === quizState.questions[index].correct_answer ? score + 1 : score;
    }, 0);
  };

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground">
              Test your knowledge with AI-generated quizzes
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
                    <Button className="flex items-center" variant="secondary">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Quiz</DialogTitle>
                      <DialogDescription>
                        Generate a quiz from your PDF content
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Number of Questions</Label>
                        <Select 
                          value={numQuestions.toString()} 
                          onValueChange={(value) => setNumQuestions(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of questions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 questions</SelectItem>
                            <SelectItem value="10">10 questions</SelectItem>
                            <SelectItem value="15">15 questions</SelectItem>
                            <SelectItem value="20">20 questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        onClick={generateQuiz}
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
          </div>
        </div>

        {selectedPdfId && quizState && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
                  </CardTitle>
                  {!quizState.showResults && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetQuiz}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg font-medium">
                  {quizState.questions[quizState.currentQuestionIndex].question}
                </div>
                
                {!quizState.showResults ? (
                  <RadioGroup
                    value={quizState.answers[quizState.currentQuestionIndex]}
                    onValueChange={handleAnswer}
                  >
                    {quizState.questions[quizState.currentQuestionIndex].options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-4">
                    <div className="text-lg font-medium">
                      Your score: {calculateScore()} / {quizState.questions.length}
                    </div>
                    <div className="space-y-2">
                      {quizState.questions.map((question, index) => (
                        <div key={index} className="space-y-2">
                          <div className="font-medium">{question.question}</div>
                          <div className="flex items-center space-x-2">
                            {quizState.answers[index] === question.correct_answer ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span>
                              Your answer: {quizState.answers[index] || 'Not answered'}
                            </span>
                          </div>
                          {quizState.answers[index] !== question.correct_answer && (
                            <div className="text-sm text-muted-foreground">
                              Correct answer: {question.correct_answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              {!quizState.showResults && (
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevQuestion}
                    disabled={quizState.currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={!quizState.answers[quizState.currentQuestionIndex]}
                  >
                    {quizState.currentQuestionIndex === quizState.questions.length - 1
                      ? 'Finish'
                      : 'Next'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Quizzes;
