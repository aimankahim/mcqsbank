import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { quizService } from '@/services/quizService';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { Input } from '@/components/ui/input';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  statement?: string;  // For true/false questions
  type?: string;  // For mixed quiz types
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  video_url?: string;
  quiz_type?: string;
  difficulty?: string;
  language?: string;
}

const QuizView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log('Location state:', location.state);
        
        // Check if we have quiz data from navigation state
        const quizData = location.state?.quizData;
        if (quizData) {
          console.log('Quiz data from state:', quizData);
          // Support both quizData.content.questions and quizData.questions
          const questions = quizData.content?.questions || quizData.questions;
          if (!questions) {
            // If it's a YouTube quiz, fetch the quiz data from the API
            if (quizData.video_url) {
              try {
                const response = await quizService.getQuiz(quizData.id);
                setQuiz({
                  id: response.id,
                  title: response.title || `Quiz for ${quizData.video_url}`,
                  questions: response.questions,
                  video_url: quizData.video_url,
                  quiz_type: response.quiz_type || 'multiple_choice',
                  difficulty: response.difficulty || 'medium',
                  language: response.language || 'English'
                });
                setAnswers(new Array(response.questions.length).fill(''));
                return;
              } catch (error) {
                console.error('Error fetching quiz data:', error);
                throw new Error('Failed to fetch quiz data');
              }
            }
            throw new Error('Invalid quiz data: missing questions');
          }
          setQuiz({
            id: quizData.id,
            title: quizData.title,
            questions,
            video_url: quizData.video_url,
            quiz_type: quizData.content?.quiz_type || quizData.quiz_type || 'multiple_choice',
            difficulty: quizData.content?.difficulty || quizData.difficulty || 'medium',
            language: quizData.content?.language || quizData.language || 'English'
          });
          setAnswers(new Array(questions.length).fill(''));
        } else {
          // If no quiz data in state, try to get from localStorage
          const storedContent = localStorage.getItem('generatedContent');
          if (storedContent) {
            const quizData = JSON.parse(storedContent);
            console.log('Quiz data from localStorage:', quizData);
            
            // If it's a YouTube quiz, fetch the quiz data from the API
            if (quizData.video_url) {
              try {
                const response = await quizService.getQuiz(quizData.id);
                setQuiz({
                  id: response.id,
                  title: response.title || `Quiz for ${quizData.video_url}`,
                  questions: response.questions,
                  video_url: quizData.video_url,
                  quiz_type: response.quiz_type || 'multiple_choice',
                  difficulty: response.difficulty || 'medium',
                  language: response.language || 'English'
                });
                setAnswers(new Array(response.questions.length).fill(''));
                return;
              } catch (error) {
                console.error('Error fetching quiz data:', error);
                throw new Error('Failed to fetch quiz data');
              }
            }
            
            // Support both quizData.content.questions and quizData.questions
            const questions = quizData.content?.questions || quizData.questions;
            if (!questions) {
              throw new Error('Invalid quiz data: missing questions');
            }
            
            setQuiz({
              id: quizData.id,
              title: quizData.title,
              questions,
              video_url: quizData.video_url,
              quiz_type: quizData.content?.quiz_type || quizData.quiz_type || 'multiple_choice',
              difficulty: quizData.content?.difficulty || quizData.difficulty || 'medium',
              language: quizData.content?.language || quizData.language || 'English'
            });
            setAnswers(new Array(questions.length).fill(''));
          } else {
            throw new Error('No quiz data available');
          }
        }
      } catch (error) {
        console.error('Error initializing quiz:', error);
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

    initializeQuiz();
  }, [id, navigate, toast, location.state]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
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
  if (!currentQuestion) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Invalid quiz question</h2>
          <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
        </div>
      </MainLayout>
    );
  }

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

  const generateWordDocument = () => {
    if (!quiz) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: quiz.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Generated Quiz - ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }), // Spacing
          ...quiz.questions.map((question, index) => [
            new Paragraph({
              text: `Question ${index + 1}: ${question.question}`,
              heading: HeadingLevel.HEADING_2,
            }),
            ...question.options.map(option => 
              new Paragraph({
                text: `• ${option}`,
                indent: { left: 720 }, // 0.5 inch indent
              })
            ),
            new Paragraph({
              text: `Correct Answer: ${question.correct_answer}`,
            }),
            new Paragraph({ text: '' }), // Spacing between questions
          ]).flat(),
        ],
      }],
    });

    // Generate and download the document
    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  // Move renderQuestionByType inside the component
  const renderQuestionByType = (question: QuizQuestion) => {
    switch (question.type) {
      case 'fill_in_blank':
        return (
          <div className="space-y-4">
            <Input
              type="text"
              value={answers[currentQuestionIndex]}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 text-lg"
            />
            <div className="text-sm text-gray-500">
              Hint: Type the exact word or phrase that fits in the blank
            </div>
          </div>
        );
      case 'true_false':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {['true', 'false'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                    answers[currentQuestionIndex] === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border ${
                  answers[currentQuestionIndex] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              {quiz.video_url && (
                <p className="text-gray-600">
                  Video: <a href={quiz.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{quiz.video_url}</a>
                </p>
              )}
              <div className="flex gap-4 mt-2">
                {quiz.difficulty && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    Difficulty: {quiz.difficulty}
                  </span>
                )}
                {quiz.language && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    Language: {quiz.language}
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={generateWordDocument}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Download className="h-5 w-5" />
              <span className="font-medium">Download Quiz</span>
            </Button>
          </div>
        </div>

        {!showResults ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              {quiz.quiz_type === 'mixed' && currentQuestion.type && (
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">
                  {currentQuestion.type.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-lg font-medium bg-white/50 p-4 rounded-lg border border-gray-100">
              {quiz.questions[currentQuestionIndex].question}
            </div>

            <div className="space-y-3">
              {quiz.quiz_type === 'mixed' ? (
                renderQuestionByType(quiz.questions[currentQuestionIndex])
              ) : quiz.quiz_type === 'fill_in_blank' ? (
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={answers[currentQuestionIndex]}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 text-lg"
                  />
                  <div className="text-sm text-gray-500">
                    Hint: Type the exact word or phrase that fits in the blank
                  </div>
                </div>
              ) : quiz.quiz_type === 'true_false' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {['true', 'false'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        className={`p-6 text-lg font-medium rounded-lg border-2 transition-all ${
                          answers[currentQuestionIndex] === option
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
                currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg border ${
                      answers[currentQuestionIndex] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
              >
                {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Quiz Results</h2>
              <Button
                onClick={generateWordDocument}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Download Quiz</span>
              </Button>
            </div>
            <p className="text-xl mb-6">
              Your score: {calculateScore()}%
            </p>

            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="font-semibold mb-2">{question.question}</h3>
                  {quiz.quiz_type === 'fill_in_blank' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Your answer: {answers[index]}
                      </p>
                      <p className="text-sm text-gray-600">
                        Correct answer: {question.correct_answer}
                      </p>
                    </div>
                  ) : quiz.quiz_type === 'true_false' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Your answer: {answers[index]}
                      </p>
                      <p className="text-sm text-gray-600">
                        Correct answer: {question.correct_answer}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Your answer: {answers[index]}
                      </p>
                      <p className="text-sm text-gray-600">
                        Correct answer: {question.correct_answer}
                      </p>
                    </>
                  )}
                  <div className="mt-2">
                    {answers[index] === question.correct_answer ? (
                      <span className="text-green-500">✓ Correct</span>
                    ) : (
                      <span className="text-red-500">✗ Incorrect</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button onClick={resetQuiz} className="mr-4">
                Try Again
              </Button>
              <Button onClick={() => navigate('/youtube')} variant="outline">
                Back to YouTube
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default QuizView; 