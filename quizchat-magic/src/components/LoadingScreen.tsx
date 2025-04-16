import React from 'react';
import { FileText } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-brand-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-ping"></div>
        </div>
        <h1 className="text-2xl font-bold text-gradient animate-fadeIn">PDFLearner</h1>
        <p className="text-muted-foreground animate-fadeIn">Loading your learning experience...</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 