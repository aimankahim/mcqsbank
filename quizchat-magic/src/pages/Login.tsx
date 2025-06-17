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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { login, signup, clearError, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  };

  const validateName = (name: string): boolean => {
    return name.length >= 3 && /^[a-zA-Z0-9_]+$/.test(name);
  };

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
      // Map common auth errors to user-friendly messages
      let friendlyError = authError;
      
      if (authError.includes('Invalid credentials')) {
        friendlyError = 'Invalid email or password. Please try again.';
      } else if (authError.includes('User not found')) {
        friendlyError = 'No account found with this email address.';
      } else if (authError.includes('Email already in use')) {
        friendlyError = 'This email is already registered. Please log in or use a different email.';
      }
      
      setError(friendlyError);
      setShowAlert(true);
    }
  }, [authError]);

  // Clear error when switching tabs
  useEffect(() => {
    setError('');
    setValidationErrors({});
    setShowAlert(false);
    clearError();
  }, [activeTab, clearError]);

  // Check username availability when name changes
  useEffect(() => {
    const checkUsername = async () => {
      if (name.length < 3) {
        setUsernameExists(false);
        setValidationErrors(prev => ({ ...prev, name: 'Name must be at least 3 characters' }));
        return;
      }
      
      if (!validateName(name)) {
        setUsernameExists(false);
        setValidationErrors(prev => ({ ...prev, name: 'Name can only contain letters, numbers, and underscores' }));
        return;
      }
      
      try {
        const username = name.toLowerCase().replace(/\s+/g, '');
        const response = await authService.checkUsername(username);
        setUsernameExists(response);
        if (response) {
          setValidationErrors(prev => ({ ...prev, name: `Username "${username}" is already taken` }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.name;
            return newErrors;
          });
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
    
    // Clear previous errors
    setError('');
    setValidationErrors({});
    setShowAlert(false);
    
    // Validate form based on active tab
    if (activeTab === 'login') {
      if (!email || !password) {
        setError('Please fill in all fields');
        setShowAlert(true);
        return;
      }
      
      if (!validateEmail(email)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return;
      }
    } else {
      // Signup validation
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        setShowAlert(true);
        return;
      }
      
      if (!validateName(name)) {
        setValidationErrors(prev => ({ ...prev, name: 'Name must be at least 3 characters and can only contain letters, numbers, and underscores' }));
        return;
      }
      
      if (usernameExists) {
        setError('Please choose a different name');
        setShowAlert(true);
        return;
      }
      
      if (!validateEmail(email)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return;
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setValidationErrors(prev => ({ ...prev, password: passwordValidation.message }));
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      if (activeTab === 'login') {
        const loginSuccess = await login(email, password);
        if (loginSuccess) {
          navigate('/');
        }
      } else {
        await signup(email, password, name);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      let errorMessage = err.response?.data?.detail || err.message || 'An unexpected error occurred';
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid input data. Please check your entries.';
      }
      
      setError(errorMessage);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string, value: string) => {
    setter(value);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error if user starts typing
    if (error && value.trim()) {
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
          <h1 className="text-4xl font-bold text-gradient mb-2">EDUFLEX</h1>
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
                      onChange={(e) => handleInputChange(setEmail, 'email', e.target.value)}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
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
                      onChange={(e) => handleInputChange(setPassword, 'password', e.target.value)}
                      required
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-500">{validationErrors.password}</p>
                    )}
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="JohnDoe123"
                      value={name}
                      onChange={(e) => handleInputChange(setName, 'name', e.target.value)}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                    {!validationErrors.name && name.length > 0 && (
                      <p className="text-sm text-green-500">
                        {usernameExists ? 'Username is taken' : 'Username is available'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => handleInputChange(setEmail, 'email', e.target.value)}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleInputChange(setPassword, 'password', e.target.value)}
                      required
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-500">{validationErrors.password}</p>
                    )}
                    {password.length > 0 && !validationErrors.password && (
                      <div className="text-xs text-gray-500">
                        <p>Password must:</p>
                        <ul className="list-disc pl-4">
                          <li className={password.length >= 8 ? 'text-green-500' : ''}>
                            Be at least 8 characters
                          </li>
                          <li className={/\d/.test(password) ? 'text-green-500' : ''}>
                            Contain at least one number
                          </li>
                          <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}>
                            Contain at least one special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting || usernameExists}>
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
