
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, BrainCircuit, MessageSquare, ScrollText, BookOpen } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-50 to-purple-50">
      {/* Header/Navigation */}
      <header className="w-full py-4 px-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gradient">AI Quizz Managamment</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
          <Button onClick={() => navigate('/login?tab=signup')}>Sign Up</Button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 max-w-4xl text-gradient">
          Transform Your PDFs into Interactive Learning Materials
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Upload your PDFs, create flashcards, generate quizzes, take notes, and chat with your documents using AI.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-brand-600 hover:bg-brand-700" onClick={() => navigate('/login')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
            Try Demo
          </Button>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How AI Quizz Managamment Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload PDFs</h3>
              <p className="text-gray-600">
                Upload your study materials, research papers, or any PDF documents you want to learn from.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <BrainCircuit className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Our AI analyzes your PDFs to help you create learning materials and understand the content better.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with PDFs</h3>
              <p className="text-gray-600">
                Ask questions about your documents and get instant, contextual answers based on the content.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Learning Tools Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Powerful Learning Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-sm flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Flashcards</h3>
                <p className="text-gray-600">
                  Create flashcards from your PDFs automatically. Our AI helps identify key concepts and generates question-answer pairs to help you memorize important information.
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 p-0 text-brand-600"
                  onClick={() => navigate('/login')}
                >
                  Try Flashcards →
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <ScrollText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Quizzes</h3>
                <p className="text-gray-600">
                  Generate quizzes based on your uploaded PDFs. Test your knowledge with multiple-choice questions and track your progress over time.
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 p-0 text-purple-600"
                  onClick={() => navigate('/login')}
                >
                  Try Quizzes →
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Chat</h3>
                <p className="text-gray-600">
                  Chat with your PDFs using our AI assistant. Ask questions, get summaries, and explore concepts mentioned in your documents.
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 p-0 text-brand-600"
                  onClick={() => navigate('/login')}
                >
                  Try Chat →
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Notes</h3>
                <p className="text-gray-600">
                  Generate concise notes from your PDFs. Our AI helps you extract key points and organize information for better understanding and retention.
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 p-0 text-purple-600"
                  onClick={() => navigate('/login')}
                >
                  Try Notes →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand-50 to-purple-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of students and professionals who are using AI Quizz Managamment to study smarter, not harder.
          </p>
          <Button size="lg" className="bg-brand-600 hover:bg-brand-700" onClick={() => navigate('/login')}>
            Get Started for Free
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-xl font-bold text-gradient">AI Quizz Managamment</h1>
            <p className="text-sm text-gray-500">Transform your PDFs into interactive learning materials</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-700">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-700">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
