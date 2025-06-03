import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BrainCircuit, MessageSquare } from 'lucide-react';
import { authService } from '@/services/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [usernameExists, setUsernameExists] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  
  const { login, signup, clearError, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Handle auth context errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      setShowAlert(true);
    }
  }, [authError]);

  // Clear error when switching tabs
  useEffect(() => {
    setError('');
    setShowAlert(false);
    clearError();
  }, [activeTab, clearError]);

  // Check username availability when name changes
  useEffect(() => {
    const checkUsername = async () => {
      if (name.length < 3) {
        setUsernameExists(false);
        return;
      }
      try {
        const username = name.toLowerCase().replace(/\s+/g, '');
        const response = await authService.checkUsername(username);
        setUsernameExists(response);
        if (response) {
          setError(`Username "${username}" is already taken. Please try a different name.`);
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Failed to check username:', err);
      }
    };

    if (activeTab === 'signup') {
      checkUsername();
    }
  }, [name, activeTab]);

  // Show alert when error occurs
  useEffect(() => {
    if (error) {
      setShowAlert(true);
      // Hide alert after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'signup' && usernameExists) {
      setError('Please choose a different name');
      setShowAlert(true);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setShowAlert(false);
    
    try {
      console.log('Form submitted:', { activeTab, email });
      if (activeTab === 'login') {
        try {
          await login(email, password);
          // Only navigate if login was successful
          if (isAuthenticated) {
            navigate('/');
          }
        } catch (loginError: any) {
          console.error('Login error:', loginError);
          // Extract the error message from the error object
          const errorMessage = loginError.response?.data?.detail || loginError.message || 'Invalid email or password';
          setError(errorMessage);
          setShowAlert(true);
        }
      } else {
        try {
          await signup(email, password, name);
          if (isAuthenticated) {
            navigate('/');
          }
        } catch (signupError: any) {
          console.error('Signup error:', signupError);
          const errorMessage = signupError.response?.data?.detail || signupError.message || 'Failed to create account';
          setError(errorMessage);
          setShowAlert(true);
        }
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'An unexpected error occurred';
      setError(errorMessage);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    // Only clear error if user has typed something
    if (value.trim()) {
      setError('');
      setShowAlert(false);
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error || 'An error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">AI Quiz Management</h1>
          <p className="text-gray-600">Transform your PDFs into interactive learning materials</p>
        </div>
        
        <div className="flex justify-center space-x-8 my-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-brand-600" />
            </div>
            <p className="text-sm font-medium">Upload PDFs</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <BrainCircuit className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium">Create Study Materials</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6 text-brand-600" />
            </div>
            <p className="text-sm font-medium">Chat with PDFs</p>
          </div>
        </div>
        
        <Card>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Login to your account to continue learning
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => handleInputChange(setEmail, e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleInputChange(setPassword, e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Join us to start transforming your PDFs into learning materials
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => handleInputChange(setName, e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => handleInputChange(setEmail, e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleInputChange(setPassword, e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;
