import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { quizService } from '@/services/quizService';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  created_at: string;
}

const QuizView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!id) return;
        const response = await quizService.getQuiz(id);
        setQuiz(response);
        setAnswers(new Array(response.questions.length).fill(''));
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz',
          variant: 'destructive',
        });
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!quiz) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Quiz not found</h2>
          <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
        </div>
      </MainLayout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    const correctAnswers = quiz.questions.reduce((count, question, index) => {
      return count + (question.correct_answer === answers[index] ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const resetQuiz = () => {
    setAnswers(new Array(quiz.questions.length).fill(''));
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  return (
    <MainLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/quizzes')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
          </div>
        </div>

        {showResults ? (
          <Card>
            <CardHeader>
              <CardTitle>Quiz Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-2">{calculateScore()}%</h2>
                  <p className="text-muted-foreground">
                    You got {quiz.questions.filter((q, i) => q.correct_answer === answers[i]).length} out of {quiz.questions.length} questions correct
                  </p>
                </div>

                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium mb-2">{question.question}</p>
                          <p className="text-sm">
                            Your answer: <span className={answers[index] === question.correct_answer ? 'text-green-600' : 'text-red-600'}>
                              {answers[index]}
                            </span>
                          </p>
                          {answers[index] !== question.correct_answer && (
                            <p className="text-sm text-green-600">
                              Correct answer: {question.correct_answer}
                            </p>
                          )}
                        </div>
                        {answers[index] === question.correct_answer ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button onClick={resetQuiz}>Try Again</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-lg font-medium">{currentQuestion.question}</p>

                <RadioGroup
                  value={answers[currentQuestionIndex]}
                  onValueChange={handleAnswer}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <label
                        htmlFor={`option-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between">
                  <Button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={!answers[currentQuestionIndex]}
                  >
                    {currentQuestionIndex === quiz.questions.length - 1
                      ? 'Finish'
                      : 'Next'}
                    {currentQuestionIndex < quiz.questions.length - 1 && (
                      <ArrowRight className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default QuizView; 