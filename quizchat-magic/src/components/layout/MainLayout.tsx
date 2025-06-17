import React, { useState } from 'react';
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
  GraduationCap,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Upload size={20} />, label: 'Upload', path: '/upload' },
    { icon: <FileText size={20} />, label: 'PDFs', path: '/pdfs' },
    { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
    { icon: <BrainCircuit size={20} />, label: 'Flashcards', path: '/flashcards' },
    { icon: <ScrollText size={20} />, label: 'Quizzes', path: '/quizzes' },
    { icon: <BookOpen size={20} />, label: 'Notes', path: '/notes' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile menu button - only visible on mobile */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar - always visible on desktop, conditionally visible on mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0', // Always visible on desktop
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full' // Mobile behavior
        )}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    location.pathname === item.path && 'bg-gray-100'
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false); // Close mobile menu when an item is selected
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span className="ml-3">Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content - adjusted for sidebar width on desktop */}
      <div className="flex-1 flex flex-col lg:ml-64"> {/* Add margin on desktop */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
