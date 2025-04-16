import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PDFProvider } from '@/contexts/PDFContext';
import { LearningProvider } from '@/contexts/LearningContext';
import { Toaster } from '@/components/ui/toaster';
import AppRoutes from '@/routes';
import LoadingScreen from '@/components/LoadingScreen';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AuthProvider>
        <PDFProvider>
          <LearningProvider>
            <AppRoutes />
            <Toaster />
          </LearningProvider>
        </PDFProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
