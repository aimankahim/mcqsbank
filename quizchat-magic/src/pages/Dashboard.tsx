import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { usePDF } from '@/contexts/PDFContext';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Upload,
  FileText,
  Brain,
  ScrollText,
  BookOpen,
  Plus,
  BrainCircuit,
  Clock,
  TrendingUp,
  Activity,
  Youtube,
  PlayCircle,
  MessageSquare,
  Loader2,
  HelpCircle,
  X
} from 'lucide-react';
import { learningService } from '@/services/learning';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '@/config/api';
import { authService } from '@/services/auth';
import { toast } from '@/components/ui/use-toast';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
  video_url?: string;
  content_type?: 'quiz' | 'flashcard' | 'note';
}

interface RecentNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ActivityData {
  date: string;
  pdfs: number;
  flashcards: number;
  quizzes: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface PDF {
  id: number;
  title: string;
  file: string;
  created_at: string;
  processed: boolean;
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6'];

const Dashboard: React.FC = () => {
  const { pdfs, loading } = usePDF();
  const { flashcards, getFlashcardsByPDF, recentFlashcards: contextRecentFlashcards, updateFlashcardLastViewed } = useLearning();
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState<RecentItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [runTour, setRunTour] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const computedTotalFlashcards = Array.isArray(pdfs) ? pdfs.reduce((total, pdf) => {
    return total + getFlashcardsByPDF(pdf.id).length;
  }, 0) : 0;

  const recentPdfs = Array.isArray(pdfs) ? pdfs.slice(0, 3) : [];

  useEffect(() => {
    const firstVisit = localStorage.getItem('firstVisit');
    if (!firstVisit) {
      setIsFirstTimeUser(true);
      setRunTour(true);
      localStorage.setItem('firstVisit', 'false');
    }
  }, []);

  const tourSteps: Step[] = [
    {
      target: '.stats-section',
      content: 'Welcome to your learning dashboard! Here you can see your overall progress stats.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.activity-chart',
      content: 'This chart shows your learning activity over time. Track how much you study each day!',
      placement: 'top',
    },
    {
      target: '.distribution-chart',
      content: 'See how your learning content is distributed between PDFs, flashcards, and quizzes.',
      placement: 'top',
    },
    {
      target: '.recent-pdfs',
      content: 'Your recently uploaded PDFs appear here. Click to view and study them.',
      placement: 'top',
    },
    {
      target: '.recent-flashcards',
      content: 'Practice with your recent flashcards here. Spaced repetition helps with memorization!',
      placement: 'top',
    },
    {
      target: '.recent-quizzes',
      content: 'Test your knowledge with recently generated quizzes. Try to beat your high scores!',
      placement: 'top',
    },
    {
      target: '.help-button',
      content: 'You can always restart this tour by clicking the help button.',
      placement: 'bottom',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
    }
  };

  const restartTour = () => {
    setRunTour(true);
  };

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const data = await learningService.getLearningActivity();
        setActivityData(data);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };
    fetchActivityData();
  }, []);

  const distributionData = [
    { name: 'PDFs', value: pdfs.length },
    { name: 'Flashcards', value: totalFlashcards },
    { name: 'Quizzes', value: totalQuizzes }
  ];

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        setIsLoading(true);
        
        const [quizzesRes, notesRes, totalCountsRes, flashcardsRes] = await Promise.all([
          learningService.getRecentQuizzes(),
          api.get('/api/notes/recent/'),
          learningService.getTotalCounts(),
          learningService.getRecentFlashcards()
        ]);

        const transformedQuizzes = quizzesRes.map((quiz: any) => ({
          id: quiz.id,
          title: quiz.title || 'Untitled Quiz',
          description: quiz.description || '',
          created_at: quiz.created_at,
          quiz_type: quiz.quiz_type || 'multiple_choice',
          difficulty: quiz.difficulty || 'medium',
          language: quiz.language || 'English,Malay'
        }));

        const transformedFlashcards = flashcardsRes.map((fc: any) => ({
          id: fc.id,
          front: fc.front_content,
          back: fc.back_content,
          created_at: fc.created_at,
        }));

        setRecentQuizzes(transformedQuizzes);
        setNotes(notesRes.data);
        setTotalQuizzes(totalCountsRes.total_quizzes);
        setTotalFlashcards(totalCountsRes.total_flashcards);
        setRecentFlashcards(transformedFlashcards);
      } catch (error) {
        console.error('Error fetching recent items:', error);
        setRecentQuizzes([]);
        setNotes([]);
        setTotalQuizzes(0);
        setTotalFlashcards(0);
        setRecentFlashcards([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentItems();
  }, []);

  const handleFlashcardClick = (flashcardId: string) => {
    updateFlashcardLastViewed(flashcardId);
    navigate(`/flashcards?flashcard=${flashcardId}`);
  };

  const handleQuizClick = async (quizId: string) => {
    try {
      const quizData = await learningService.getQuiz(quizId);
      navigate(`/quizzes/${quizId}`, { state: { quizData } });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <Joyride
          steps={tourSteps}
          run={runTour}
          callback={handleJoyrideCallback}
          continuous={true}
          scrollToFirstStep={true}
          showSkipButton={true}
          styles={{
            options: {
              primaryColor: '#8B5CF6',
              textColor: '#374151',
              backgroundColor: '#FFFFFF',
              overlayColor: 'rgba(107, 114, 128, 0.4)',
              arrowColor: '#FFFFFF',
            },
            buttonNext: {
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
            },
            buttonBack: {
              color: '#8B5CF6',
            },
            buttonSkip: {
              color: '#EF4444',
            }
          }}
        />
        
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={restartTour}
              className="help-button bg-brand-600 hover:bg-brand-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
              aria-label="Help"
            >
              <HelpCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Track your learning progress and access your recent activities
            </p>
            
            {isFirstTimeUser && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-brand-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="bg-brand-100 p-2 rounded-full">
                      <HelpCircle className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Welcome to your learning dashboard!</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        We'll guide you through the main features. Follow the tour to get started.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsFirstTimeUser(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-7xl mx-auto">
            {/* Horizontal Stats Section */}
            <div className="stats-section mb-6 sm:mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-gray-200">
                  {/* PDFs Card */}
                  <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">PDFs</h3>
                      <p className="text-sm text-gray-600 mb-3">Total Uploaded</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                        {pdfs.length}
                      </p>
                    </div>
                  </div>

                  {/* Flashcards Card */}
                  <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-3">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Flashcards</h3>
                      <p className="text-sm text-gray-600 mb-3">Total Created</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                        {totalFlashcards}
                      </p>
                    </div>
                  </div>

                  {/* Quizzes Card */}
                  <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-3">
                        <ScrollText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Quizzes</h3>
                      <p className="text-sm text-gray-600 mb-3">Total Generated</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                        {totalQuizzes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Activity Chart - Left Side */}
              <Card className="activity-chart bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <Activity className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Learning Activity</CardTitle>
                      <CardDescription className="text-sm sm:text-base">Last 7 days activity overview</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="colorPdfs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFlashcards" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area type="monotone" dataKey="pdfs" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorPdfs)" />
                        <Area type="monotone" dataKey="flashcards" stroke="#EC4899" fillOpacity={1} fill="url(#colorFlashcards)" />
                        <Area type="monotone" dataKey="quizzes" stroke="#3B82F6" fillOpacity={1} fill="url(#colorQuizzes)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Chart - Right Side */}
              <Card className="distribution-chart bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Content Distribution</CardTitle>
                      <CardDescription className="text-sm sm:text-base">Overview of your learning content</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-gray-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Items Section */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Recent PDFs */}
              <Card className="recent-pdfs bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Recent PDFs</CardTitle>
                        <CardDescription className="text-sm sm:text-base">Your recently uploaded PDFs</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/upload')}
                      className="h-7 sm:h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentPdfs.length > 0 ? (
                    <div className="space-y-3">
                      {recentPdfs.map((pdf) => (
                        <div
                          key={pdf.id}
                          className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg cursor-pointer transition-all duration-200 group"
                          onClick={() => navigate(`/pdfs/${pdf.id}`)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <FileText className="h-4 w-4 text-brand-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors duration-200">
                              {pdf.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {format(new Date(pdf.uploaded_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-brand-600" />
                      </div>
                      <p className="text-gray-600 mb-4">No PDFs uploaded yet</p>
                      <Button
                        size="lg"
                        onClick={() => navigate('/upload')}
                        className="bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload PDF
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Flashcards */}
              <Card className="recent-flashcards bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <Brain className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Recent Flashcards</CardTitle>
                        <CardDescription className="text-sm sm:text-base">Your recently viewed flashcards</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/flashcards')}
                      className="h-7 sm:h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentFlashcards.length > 0 ? (
                    <div className="space-y-4">
                      {recentFlashcards.map((flashcard) => (
                        <div
                          key={flashcard.id}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => navigate(`/flashcards/${flashcard.id}`)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Brain className="h-4 w-4 text-brand-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors duration-200 truncate max-w-[200px]">
                              {flashcard.front}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {format(new Date(flashcard.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-6 w-6 text-brand-600" />
                      </div>
                      <p className="text-gray-600 mb-4">No flashcards viewed yet</p>
                      <Button
                        size="lg"
                        onClick={() => navigate('/flashcards')}
                        className="bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Brain className="h-5 w-5 mr-2" />
                        Create Flashcards
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Quizzes */}
              <Card className="recent-quizzes bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <ScrollText className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Recent Quizzes</CardTitle>
                        <CardDescription className="text-sm sm:text-base">Your recently generated quizzes</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/quizzes')}
                      className="h-7 sm:h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  ) : Array.isArray(recentQuizzes) && recentQuizzes.length > 0 ? (
                    <div className="space-y-3">
                      {recentQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg cursor-pointer transition-all duration-200 group"
                          onClick={() => handleQuizClick(quiz.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <ScrollText className="h-4 w-4 text-brand-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors duration-200">
                              {quiz.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <ScrollText className="h-6 w-6 text-brand-600" />
                      </div>
                      <p className="text-gray-600 mb-4">No quizzes generated yet</p>
                      <Button
                        size="lg"
                        onClick={() => navigate('/quizzes')}
                        className="bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <ScrollText className="h-5 w-5 mr-2" />
                        Generate Quiz
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
