import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  BrainCircuit, 
  ScrollText, 
  User, 
  LogOut,
  Upload,
  BookOpen,
  Youtube,
  GraduationCap
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Upload size={20} />, label: 'Upload', path: '/upload' },
    { icon: <FileText size={20} />, label: 'PDFs', path: '/pdfs' },
    { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
    { icon: <BrainCircuit size={20} />, label: 'Flashcards', path: '/flashcards' },
    { icon: <ScrollText size={20} />, label: 'Quizzes', path: '/quizzes' },
    { icon: <BookOpen size={20} />, label: 'Notes', path: '/notes' },
    { icon: <Youtube size={20} />, label: 'YouTube', path: '/youtube' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-brand-50 to-purple-50 border-r border-border/50 shadow-lg flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              AI Quizz Managamment
            </h1>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200
                ${location.pathname === item.path 
                  ? 'bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-lg scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white/50 hover:shadow-md'
                }`}
            >
              <span className={`mr-3 ${location.pathname === item.path ? 'text-white' : 'text-brand-600'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* User Profile Section */}
        <div className="p-6 border-t border-border/50">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg">
                <User size={24} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.username || 'User'}</p>
                <p className="text-sm text-gray-600">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost"
            size="lg"
            className="w-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-brand-600 shadow-lg rounded-xl transition-all duration-200"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={20} className="mr-2" />
            Log out
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
