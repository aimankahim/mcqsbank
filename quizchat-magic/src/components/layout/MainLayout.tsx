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
  BookOpen
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboardupdated', path: '/' },
    { icon: <Upload size={20} />, label: 'Upload', path: '/upload' },
    { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
    { icon: <BrainCircuit size={20} />, label: 'Flashcards', path: '/flashcards' },
    { icon: <ScrollText size={20} />, label: 'Quizzes', path: '/quizzes' },
    { icon: <BookOpen size={20} />, label: 'Notes', path: '/notes' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-border shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-center">
          <h1 className="text-xl font-bold text-gradient">PDFLearner</h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors
              ${location.pathname === item.path ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
              <User size={20} className="text-brand-700" />
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} className="mr-2" />
            Log out
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
