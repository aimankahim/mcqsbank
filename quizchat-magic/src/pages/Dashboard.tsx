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
  PlayCircle
} from 'lucide-react';
import { learningService } from '@/services/learning';
import { format, subDays } from 'date-fns';
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
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '@/config/api';
import { authService } from '@/services/auth';
import { toast } from '@/components/ui/use-toast';

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

interface YouTubeContent {
  id: string;
  title: string;
  created_at: string;
  video_url: string;
  content_type: 'quiz' | 'flashcards' | 'notes';
  thumbnail_url?: string;
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6'];

const Dashboard: React.FC = () => {
  const { pdfs, loading } = usePDF();
  const { flashcards, getFlashcardsByPDF, recentFlashcards, updateFlashcardLastViewed } = useLearning();
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState<RecentItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [youtubeContent, setYoutubeContent] = useState<YouTubeContent[]>([]);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(true);

  const totalFlashcards = Array.isArray(pdfs) ? pdfs.reduce((total, pdf) => {
    return total + getFlashcardsByPDF(pdf.id).length;
  }, 0) : 0;

  const recentPdfs = Array.isArray(pdfs) ? pdfs.slice(0, 3) : [];

  // Generate mock activity data for the last 7 days
  useEffect(() => {
    const generateActivityData = () => {
      const data: ActivityData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
          date: format(date, 'MMM dd'),
          pdfs: Math.floor(Math.random() * 5),
          flashcards: Math.floor(Math.random() * 10),
          quizzes: Math.floor(Math.random() * 8)
        });
      }
      setActivityData(data);
    };

    generateActivityData();
  }, []);

  // Calculate distribution data for pie chart
  const distributionData = [
    { name: 'PDFs', value: pdfs.length },
    { name: 'Flashcards', value: totalFlashcards },
    { name: 'Quizzes', value: recentQuizzes.length }
  ];

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        setIsLoading(true);
        const [quizzes, notes] = await Promise.all([
          learningService.getRecentQuizzes(),
          learningService.getRecentNotes(),
        ]);

        setRecentQuizzes(Array.isArray(quizzes) ? quizzes : []);
        setRecentNotes(Array.isArray(notes) ? notes : []);
      } catch (error) {
        console.error('Error fetching recent items:', error);
        setRecentQuizzes([]);
        setRecentNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentItems();
  }, []);

  // Add this new useEffect for fetching YouTube content
  useEffect(() => {
    const fetchYouTubeContent = async () => {
      try {
        setIsLoadingYoutube(true);
        const token = authService.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await api.get('/api/youtube/history/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data) {
          setYoutubeContent(response.data);
        }
      } catch (error) {
        console.error('Error fetching YouTube content:', error);
        toast({
          title: "Error",
          description: "Failed to fetch YouTube content history",
          variant: "destructive",
        });
      } finally {
        setIsLoadingYoutube(false);
      }
    };

    fetchYouTubeContent();
  }, []);

  const handleFlashcardClick = (flashcardId: string) => {
    updateFlashcardLastViewed(flashcardId);
    navigate(`/flashcards?flashcard=${flashcardId}`);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <ScrollText className="h-4 w-4" />;
      case 'flashcard':
        return <Brain className="h-4 w-4" />;
      case 'note':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <PlayCircle className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'from-blue-500 to-blue-600';
      case 'flashcard':
        return 'from-purple-500 to-purple-600';
      case 'note':
        return 'from-brand-500 to-brand-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Track your learning progress and access your recent activities
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">PDFs</CardTitle>
              <CardDescription>Total PDFs uploaded</CardDescription>
                    </div>
                  </div>
            </CardHeader>
            <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                    {pdfs.length}
                  </p>
            </CardContent>
          </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Flashcards</CardTitle>
              <CardDescription>Total flashcards created</CardDescription>
                    </div>
                  </div>
            </CardHeader>
            <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                    {totalFlashcards}
                  </p>
            </CardContent>
          </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <ScrollText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Quizzes</CardTitle>
              <CardDescription>Total quizzes generated</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                    {recentQuizzes.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Activity Chart */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">Learning Activity</CardTitle>
                      <CardDescription>Last 7 days activity overview</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
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

              {/* Distribution Chart */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">Content Distribution</CardTitle>
                      <CardDescription>Overview of your learning content</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
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

            {/* YouTube Content History Section */}
            <div className="mb-8">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">YouTube Learning History</CardTitle>
                        <CardDescription>Your recently created content from YouTube videos</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/youtube')}
                      className="h-8 hover:bg-red-50 hover:text-red-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
            </CardHeader>
            <CardContent>
                  {isLoadingYoutube ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                  ) : youtubeContent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {youtubeContent.map((content) => (
                        <div
                          key={content.id}
                          className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer"
                          onClick={() => {
                            if (content.content_type === 'quiz') {
                              navigate(`/quizzes/${content.id}`, { 
                                state: { 
                                  quizData: {
                                    id: content.id,
                                    title: content.title,
                                    content: content.content_data,
                                    video_url: content.video_url
                                  }
                                }
                              });
                            } else {
                              navigate(`/${content.content_type}/${content.id}`);
                            }
                          }}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-40 overflow-hidden">
                            {content.thumbnail_url ? (
                              <img
                                src={content.thumbnail_url}
                                alt={content.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gray-100">
                                <Youtube className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-2">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r ${getContentTypeColor(content.content_type)} text-white text-xs font-medium`}>
                                {getContentTypeIcon(content.content_type)}
                                <span className="ml-1 capitalize">{content.content_type}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors duration-200 line-clamp-2">
                              {content.title}
                            </h3>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {format(new Date(content.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mx-auto mb-4">
                        <Youtube className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-gray-600 mb-4">No YouTube content created yet</p>
                      <Button
                        size="lg"
                        onClick={() => navigate('/youtube')}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Youtube className="h-5 w-5 mr-2" />
                        Create from YouTube
                      </Button>
                    </div>
                  )}
            </CardContent>
          </Card>
        </div>

            {/* Recent Items Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent PDFs */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Recent PDFs</CardTitle>
              <CardDescription>Your recently uploaded PDFs</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/upload')}
                      className="h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-4 w-4" />
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
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Recent Flashcards</CardTitle>
              <CardDescription>Your recently viewed flashcards</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/flashcards')}
                      className="h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
            </CardHeader>
            <CardContent>
              {recentFlashcards.length > 0 ? (
                    <div className="space-y-3">
                  {recentFlashcards.map((flashcard) => (
                    <div
                      key={flashcard.id}
                          className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg cursor-pointer transition-all duration-200 group"
                      onClick={() => handleFlashcardClick(flashcard.id)}
                    >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Brain className="h-4 w-4 text-brand-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors duration-200 truncate max-w-[200px]">
                              {flashcard.front}
                            </span>
                      </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                        {flashcard.lastViewed && format(new Date(flashcard.lastViewed), 'MMM d, yyyy')}
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
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                        <ScrollText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Recent Quizzes</CardTitle>
              <CardDescription>Your recently generated quizzes</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/quizzes')}
                      className="h-8 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Plus className="h-4 w-4" />
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
                      onClick={() => navigate(`/quizzes/${quiz.id}`)}
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

            {/* YouTube Content History Section */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">YouTube Content</CardTitle>
                      <CardDescription>Recently created learning materials from YouTube videos</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {youtubeContent.map((content) => (
                      <div
                        key={content.id}
                        className="group relative overflow-hidden rounded-lg border bg-white/50 backdrop-blur-sm p-4 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                          {content.thumbnail_url ? (
                            <img
                              src={content.thumbnail_url}
                              alt={content.title}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100">
                              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">
                              {new Date(content.created_at).toLocaleDateString()}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              content.content_type === 'quiz'
                                ? 'bg-blue-100 text-blue-800'
                                : content.content_type === 'flashcards'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{content.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const path = content.content_type === 'quiz' ? '/quizzes' : `/${content.content_type}`;
                                navigate(path);
                              }}
                            >
                              View {content.content_type}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => window.open(content.video_url, '_blank')}
                            >
                              Watch Video
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {youtubeContent.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-gray-100 p-3">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">No YouTube content yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Create your first learning materials from YouTube videos
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate('/youtube')}
                      >
                        Create from YouTube
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
