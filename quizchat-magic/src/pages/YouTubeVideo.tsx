import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';
import { Download, Send } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ScrollArea } from '@/components/ui/scroll-area';
import MainLayout from '@/components/layout/MainLayout';

const YouTubeVideo = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quiz');
  const [showModal, setShowModal] = useState(false);
  const [numQuestions, setNumQuestions] = useState('5');
  const [numFlashcards, setNumFlashcards] = useState('5');
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState(null);
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Show the modal for quiz generation
    if (activeTab === 'quiz') {
      setShowModal(true);
    } else if (activeTab === 'chat') {
      setLoading(true);
      try {
        const token = await authService.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Process the video using the chat endpoint
        const response = await api.post('/api/youtube/chat/', {
          url
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.id) {
          setCurrentVideoId(response.data.id);
          setChatHistory([{
            role: 'assistant',
            content: response.data.content
          }]);
          setShowChatModal(true);
        } else {
          throw new Error('Failed to process video');
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process video. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // For other content types, proceed directly
      await generateContent();
    }
  };

  const generateContent = async () => {
    setLoading(true);
    try {
      console.log('Generating content with:', { url, numQuestions, numFlashcards, activeTab });
      
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Generate content directly using the YouTube endpoint
      const response = await api.post(`/api/youtube/${activeTab}/`, 
        { 
          url,
          num_questions: parseInt(numQuestions),
          num_flashcards: parseInt(numFlashcards)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Content Generation Response:', response.data);
      
      if (activeTab === 'quiz') {
        // Log the full response for debugging
        console.log('Full quiz response:', JSON.stringify(response.data, null, 2));

        // Check if response has status error
        if (response.data.status === 'error') {
          throw new Error(response.data.message || 'Failed to generate quiz');
        }

        // Validate response data structure
        if (!response.data || typeof response.data !== 'object') {
          console.error('Invalid response format:', response.data);
          throw new Error('Invalid response format from server');
        }

        // Check if we have valid quiz data
        if (!response.data.content) {
          console.error('Missing content in response:', response.data);
          throw new Error('Invalid quiz data: missing content');
        }

        if (!response.data.content.questions) {
          console.error('Missing questions in content:', response.data.content);
          throw new Error('Invalid quiz data: missing questions');
        }

        if (!Array.isArray(response.data.content.questions)) {
          console.error('Questions is not an array:', response.data.content.questions);
          throw new Error('Invalid quiz data: questions must be an array');
        }

        if (response.data.content.questions.length === 0) {
          throw new Error('No questions were generated. Please try again.');
        }

        // Validate each question
        response.data.content.questions.forEach((question: any, index: number) => {
          if (!question.question || !Array.isArray(question.options) || !question.correct_answer) {
            console.error(`Invalid question at index ${index}:`, question);
            throw new Error(`Invalid question format at index ${index}`);
          }
          if (question.options.length !== 4) {
            console.error(`Question at index ${index} has ${question.options.length} options instead of 4:`, question);
            throw new Error(`Question at index ${index} must have exactly 4 options`);
          }
        });

        setGeneratedQuiz(response.data);
        setShowModal(false);
        setAnswers(new Array(response.data.content.questions.length).fill(''));
        setCurrentQuestionIndex(0);
        setShowResults(false);
        
        toast({
          title: "Quiz Generated",
          description: "Your quiz has been generated successfully!",
        });
      } else if (activeTab === 'flashcards') {
        // Check if response has status error
        if (response.data.status === 'error') {
          throw new Error(response.data.message || 'Failed to generate flashcards');
        }

        // Validate response data structure
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format from server');
        }

        // Check if we have valid flashcards data
        if (!response.data.content || !response.data.content.cards || !Array.isArray(response.data.content.cards)) {
          console.error('Invalid flashcards data structure:', response.data);
          throw new Error('Failed to generate flashcards. Please try again.');
        }

        if (response.data.content.cards.length === 0) {
          throw new Error('No flashcards were generated. Please try again.');
        }

        // Store the generated flashcards in state
        setGeneratedFlashcards(response.data);
        setCurrentFlashcardIndex(0);
        setIsFlashcardFlipped(false);

        toast({
          title: "Flashcards Generated",
          description: `${response.data.content.cards.length} flashcards have been generated successfully!`,
        });
      } else if (activeTab === 'notes') {
        // Check if response has status error
        if (response.data.status === 'error') {
          throw new Error(response.data.message || 'Failed to generate notes');
        }

        // Validate response data structure
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format from server');
        }

        // Check if we have valid notes data
        if (!response.data.content || !response.data.content.sections || !Array.isArray(response.data.content.sections)) {
          console.error('Invalid notes data structure:', response.data);
          throw new Error('Failed to generate notes. Please try again.');
        }

        if (response.data.content.sections.length === 0) {
          throw new Error('No notes were generated. Please try again.');
        }

        // Store the generated notes in state
        setGeneratedNotes(response.data);

        toast({
          title: "Notes Generated",
          description: "Your notes have been generated successfully!",
        });
      } else {
        localStorage.setItem('generatedContent', JSON.stringify(response.data));
        navigate(`/${activeTab}`, { 
          state: { 
            [`${activeTab}Data`]: response.data,
            fromYouTube: true 
          } 
        });
      }
    } catch (err: any) {
      console.error('Error generating content:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process video';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!generatedQuiz) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (!generatedQuiz) return;
    if (currentQuestionIndex < generatedQuiz.content.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (!generatedQuiz) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const resetQuiz = () => {
    if (!generatedQuiz) return;
    setAnswers(new Array(generatedQuiz.content.questions.length).fill(''));
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const calculateScore = () => {
    if (!generatedQuiz) return 0;
    return generatedQuiz.content.questions.reduce((score: number, question: any, index: number) => {
      return score + (question.correct_answer === answers[index] ? 1 : 0);
    }, 0);
  };

  const handleDownloadNotes = async () => {
    try {
      if (!generatedNotes?.content?.sections) {
        throw new Error('No notes data available');
      }

      // Create a new document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: generatedNotes.title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            // Video URL
            new Paragraph({
              children: [
                new TextRun({
                  text: `Source: ${url}`,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            // Timestamp
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleString()}`,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            // Spacing
            new Paragraph({}),
            // Sections
            ...generatedNotes.content.sections.flatMap(section => [
              // Section title
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
              }),
              // Section content
              new Paragraph({
                text: section.content,
                spacing: {
                  after: 200,
                },
              }),
            ]),
          ],
        }],
      });

      // Generate the document as a blob
      const blob = await Packer.toBlob(doc);
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${generatedNotes.title.replace(/\s+/g, '_')}_notes.docx`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: "Notes downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading notes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentVideoId) return;

    try {
      setIsChatLoading(true);
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: chatMessage };
      setChatHistory(prev => [...prev, userMessage]);
      setChatMessage('');

      // Send message to backend
      const response = await api.post('/api/youtube/chat/message/', {
        message: chatMessage,
        video_id: currentVideoId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Add assistant's response to chat history
      if (response.data && response.data.content) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.data.content
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              YouTube Learning
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform any YouTube video into interactive learning materials with AI-powered tools
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Create Learning Materials</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Enter a YouTube URL to generate quizzes, flashcards, notes, or chat with the content
                    </CardDescription>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <Tabs defaultValue="quiz" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1 rounded-lg">
                    <TabsTrigger value="quiz" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Quiz
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Flashcards
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url" className="text-base font-medium">YouTube URL</Label>
                    <div className="relative">
                      <Input
                        id="youtube-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        className="pl-12 h-12 text-base border-2 focus:border-brand-500 focus:ring-brand-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'quiz' && (
                    <div className="space-y-2">
                      <Label htmlFor="numQuestions" className="text-base font-medium">Number of Questions</Label>
                      <Input
                        id="numQuestions"
                        type="number"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        className="h-12 text-base border-2 focus:border-brand-500 focus:ring-brand-500"
                      />
                    </div>
                  )}

                  {activeTab === 'flashcards' && (
                    <div className="space-y-2">
                      <Label htmlFor="numFlashcards" className="text-base font-medium">Number of Flashcards</Label>
                      <Input
                        id="numFlashcards"
                        type="number"
                        min="1"
                        max="20"
                        value={numFlashcards}
                        onChange={(e) => setNumFlashcards(e.target.value)}
                        className="h-12 text-base border-2 focus:border-brand-500 focus:ring-brand-500"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      `Generate ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-brand-600 hover:bg-brand-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Quiz Generation Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Generate Quiz</DialogTitle>
              <DialogDescription className="text-base">
                Choose how many questions you want to generate
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger className="h-12 text-base">
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)} className="h-12">
                Cancel
              </Button>
              <Button 
                onClick={generateContent} 
                disabled={loading}
                className="h-12 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600"
              >
                {loading ? 'Generating...' : 'Generate Quiz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Generated Modal */}
        <Dialog open={!!generatedQuiz} onOpenChange={() => setGeneratedQuiz(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Quiz Generated!</DialogTitle>
              <DialogDescription>
                {generatedQuiz?.content?.questions && !showResults ? (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">
                        Question {currentQuestionIndex + 1} of {generatedQuiz.content.questions.length}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold mb-4">
                      {generatedQuiz.content.questions[currentQuestionIndex].question}
                    </h2>

                    <div className="space-y-3">
                      {generatedQuiz.content.questions[currentQuestionIndex].options.map((option: string, index: number) => (
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
                        {currentQuestionIndex === generatedQuiz.content.questions.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </div>
                  </div>
                ) : generatedQuiz?.content?.questions && showResults ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                    <p className="text-xl mb-6">
                      Your score: {calculateScore()} / {generatedQuiz.content.questions.length}
                    </p>

                    <div className="space-y-6">
                      {generatedQuiz.content.questions.map((question: any, index: number) => (
                        <div key={index} className="border-b pb-4">
                          <h3 className="font-semibold mb-2">{question.question}</h3>
                          <p className="text-sm text-gray-600">
                            Your answer: {answers[index]}
                          </p>
                          <p className="text-sm text-gray-600">
                            Correct answer: {question.correct_answer}
                          </p>
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
                      <Button onClick={() => setGeneratedQuiz(null)} variant="outline">
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-500">Error: Invalid quiz data</p>
                    <Button onClick={() => setGeneratedQuiz(null)} variant="outline" className="mt-4">
                      Close
                    </Button>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Flashcards Generated Modal */}
        <Dialog open={!!generatedFlashcards} onOpenChange={() => setGeneratedFlashcards(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Flashcards Generated!</DialogTitle>
              <DialogDescription>
                {generatedFlashcards?.content?.cards ? (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">
                        Flashcard {currentFlashcardIndex + 1} of {generatedFlashcards.content.cards.length}
                      </span>
                    </div>

                    <Card className="relative">
                      <CardContent className="p-6">
                        <div 
                          className={`transition-transform duration-500 transform ${
                            isFlashcardFlipped ? 'rotate-y-180' : ''
                          }`}
                          onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                        >
                          <div className={`${isFlashcardFlipped ? 'hidden' : ''}`}>
                            <h3 className="text-lg font-medium mb-4">Front</h3>
                            <p className="text-lg">{generatedFlashcards.content.cards[currentFlashcardIndex].front}</p>
                          </div>
                          <div className={`${!isFlashcardFlipped ? 'hidden' : ''}`}>
                            <h3 className="text-lg font-medium mb-4">Back</h3>
                            <p className="text-lg">{generatedFlashcards.content.cards[currentFlashcardIndex].back}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between mt-6">
                      <Button
                        onClick={() => {
                          setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
                          setIsFlashcardFlipped(false);
                        }}
                        disabled={currentFlashcardIndex === 0}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => {
                          if (currentFlashcardIndex < generatedFlashcards.content.cards.length - 1) {
                            setCurrentFlashcardIndex(prev => prev + 1);
                            setIsFlashcardFlipped(false);
                          } else {
                            // Save flashcards and navigate to flashcards page
                            const flashcardsData = {
                              id: generatedFlashcards.id,
                              title: generatedFlashcards.title,
                              cards: generatedFlashcards.content.cards.map((card: any) => ({
                                front: card.front,
                                back: card.back
                              })),
                              video_url: generatedFlashcards.video_url
                            };
                            
                            localStorage.setItem('generatedFlashcards', JSON.stringify(flashcardsData));
                            
                            navigate('/flashcards', { 
                              state: { 
                                fromYouTube: true,
                                flashcardsData: flashcardsData
                              } 
                            });
                          }
                        }}
                      >
                        {currentFlashcardIndex === generatedFlashcards.content.cards.length - 1 ? 'Save & View All' : 'Next'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-500">Error: Invalid flashcard data</p>
                    <Button onClick={() => setGeneratedFlashcards(null)} variant="outline" className="mt-4">
                      Close
                    </Button>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Notes Generated Modal */}
        <Dialog open={!!generatedNotes} onOpenChange={() => setGeneratedNotes(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{generatedNotes?.title || 'Generated Notes'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {generatedNotes?.content?.sections ? (
                generatedNotes.content.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-gray-600">{section.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-500">Error: Invalid notes data</p>
                  <Button onClick={() => setGeneratedNotes(null)} variant="outline" className="mt-4">
                    Close
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadNotes}
                className="flex items-center gap-2"
                disabled={!generatedNotes?.content?.sections}
              >
                <Download className="h-4 w-4" />
                Download as Word
              </Button>
              <Button
                onClick={() => {
                  if (generatedNotes?.content?.sections) {
                    localStorage.setItem('generatedNotes', JSON.stringify(generatedNotes));
                    navigate('/notes', { state: { fromYouTube: true, notes: generatedNotes } });
                  }
                }}
                disabled={!generatedNotes?.content?.sections}
              >
                Save & View All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chat Modal */}
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Chat with Video Content</DialogTitle>
              <DialogDescription>
                Ask questions about the video content
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleChat} className="flex gap-2 p-4 border-t">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isChatLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isChatLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default YouTubeVideo; 