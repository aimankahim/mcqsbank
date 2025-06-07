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
    statement?: string;  // For true/false questions
  }>;
  currentQuestionIndex: number;
  answers: string[];
  showResults: boolean;
  quiz_type: string;
}

// Add quiz type enum
const QuizType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_IN_BLANK: 'fill_in_blank',
  MATCHING: 'matching',
  MIXED: 'mixed'
} as const;

const QuizTypeLabels = {
  [QuizType.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QuizType.TRUE_FALSE]: 'True/False',
  [QuizType.FILL_IN_BLANK]: 'Fill in the Blank',
  [QuizType.MATCHING]: 'Matching',
  [QuizType.MIXED]: 'Mixed'
} as const;

const DifficultyLevel = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
} as const;

const DifficultyLabels = {
  [DifficultyLevel.EASY]: 'Easy',
  [DifficultyLevel.MEDIUM]: 'Medium',
  [DifficultyLevel.HARD]: 'Hard'
} as const;

const Quizzes: React.FC = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [quizType, setQuizType] = useState<string>(QuizType.MULTIPLE_CHOICE);
  const [difficulty, setDifficulty] = useState<string>(DifficultyLevel.MEDIUM);
  const [language, setLanguage] = useState<string>('English');
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
        difficulty: difficulty,
        language: language,
        quiz_type: quizType,
        content: {
          quiz_type: quizType
        }
      });
      
      setQuizState({
        questions: response.questions,
        currentQuestionIndex: 0,
        answers: new Array(response.questions.length).fill(''),
        showResults: false,
        quiz_type: quizType
      });

      toast({
        title: "Quiz generated",
        description: `${response.questions.length} ${QuizTypeLabels[quizType]} questions have been generated.`,
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
        currentQuestionIndex: quizState.currentQuestionIndex
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
      quiz_type: quizState.quiz_type
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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Quizzes
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Test your knowledge with intelligent quizzes generated from your learning materials
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <ScrollText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Quiz</h2>
                    <p className="text-gray-600">Select a PDF and generate a quiz</p>
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
                            Generate Quiz
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Generate Quiz</DialogTitle>
                            <DialogDescription className="text-base">
                              Choose the quiz type and number of questions
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="py-6 space-y-6">
                            <div className="space-y-2">
                              <Label className="text-base font-medium">Quiz Type</Label>
                              <Select 
                                value={quizType} 
                                onValueChange={setQuizType}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select quiz type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(QuizTypeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-base font-medium">Difficulty Level</Label>
                              <Select 
                                value={difficulty} 
                                onValueChange={setDifficulty}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select difficulty level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(DifficultyLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-base font-medium">Language</Label>
                              <Select 
                                value={language} 
                                onValueChange={setLanguage}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="English">English</SelectItem>
                                  <SelectItem value="Spanish">Spanish</SelectItem>
                                  <SelectItem value="French">French</SelectItem>
                                  <SelectItem value="German">German</SelectItem>
                                  <SelectItem value="Chinese">Chinese</SelectItem>
                                  <SelectItem value="Japanese">Japanese</SelectItem>
                                  <SelectItem value="Korean">Korean</SelectItem>
                                  <SelectItem value="Russian">Russian</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-base font-medium">Number of Questions</Label>
                              <Select 
                                value={numQuestions.toString()} 
                                onValueChange={(value) => setNumQuestions(parseInt(value))}
                              >
                                <SelectTrigger className="h-12">
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
                                  Generate Quiz
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

            {/* Quiz Content */}
            {selectedPdfId && quizState && (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold">{quizState.currentQuestionIndex + 1}</span>
                        </div>
                        <CardTitle className="text-xl">
                          Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
                        </CardTitle>
                      </div>
                      {!quizState.showResults && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetQuiz}
                          className="hover:bg-brand-50 hover:text-brand-600"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-lg font-medium bg-white/50 p-4 rounded-lg border border-gray-100">
                      {quizState.questions[quizState.currentQuestionIndex].question}
                    </div>
                    
                    {!quizState.showResults ? (
                      quizState.quiz_type === 'fill_in_blank' ? (
                        <div className="space-y-4">
                          <Input
                            type="text"
                            value={quizState.answers[quizState.currentQuestionIndex]}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full p-4 text-lg"
                          />
                          <div className="text-sm text-gray-500">
                            Hint: Type the exact word or phrase that fits in the blank
                          </div>
                        </div>
                      ) : quizState.quiz_type === 'true_false' ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {['true', 'false'].map((option) => (
                              <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                                  quizState.answers[quizState.currentQuestionIndex] === option
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <RadioGroup
                          value={quizState.answers[quizState.currentQuestionIndex]}
                          onValueChange={handleAnswer}
                          className="space-y-3"
                        >
                          {quizState.questions[quizState.currentQuestionIndex].options.map((option, index) => (
                            <div 
                              key={index} 
                              className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:border-brand-500 transition-colors duration-200 cursor-pointer"
                            >
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label 
                                htmlFor={`option-${index}`}
                                className="text-base cursor-pointer flex-1"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center p-6 bg-gradient-to-r from-brand-50 to-purple-50 rounded-lg">
                          <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
                          <p className="text-3xl font-bold text-brand-600">
                            {calculateScore()} / {quizState.questions.length}
                          </p>
                          <Button
                            onClick={resetQuiz}
                            className="mt-4 h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Try Again
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {quizState.questions.map((question, index) => (
                            <div key={index} className="p-4 rounded-lg border border-gray-100 bg-white/50">
                              <div className="font-medium mb-2">
                                {quizState.quiz_type === 'true_false'
                                  ? `Statement ${index + 1}: ${question.question}`
                                  : question.question}
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                {quizState.answers[index] === question.correct_answer ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="text-gray-600">
                                  Your answer: {quizState.answers[index] || 'Not answered'}
                                </span>
                              </div>
                              {quizState.answers[index] !== question.correct_answer && (
                                <div className="mt-2 text-sm text-brand-600">
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
                    <CardFooter className="flex justify-between border-t pt-6">
                      <Button
                        variant="outline"
                        onClick={prevQuestion}
                        disabled={quizState.currentQuestionIndex === 0}
                        className="h-12 hover:bg-brand-50 hover:text-brand-600"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={nextQuestion}
                        disabled={!quizState.answers[quizState.currentQuestionIndex]}
                        className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
        </div>
      </div>
    </MainLayout>
  );
};

export default Quizzes;
