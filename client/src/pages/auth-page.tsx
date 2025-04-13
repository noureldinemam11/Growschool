import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Redirect } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Award, Trophy, CheckCircle, ChevronRight, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export default function AuthPage() {
  const [location] = useLocation();
  const { user, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Student Growth Platform";
  
  // Add animation effect when component mounts
  useEffect(() => {
    // Small delay for better visual effect
    const fadeTimer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    // Typing animation for subtitle
    let currentIndex = 0;
    const typingTimer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingTimer);
      }
    }, 50);
    
    return () => {
      clearTimeout(fadeTimer);
      clearInterval(typingTimer);
    };
  }, []);

  const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    } as any); // Cast to any to work around type issues
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center overflow-hidden relative bg-gradient-to-b from-primary/5 to-primary/10">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary/10 to-secondary/10 blur-3xl"></div>
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] rounded-full bg-secondary/5 blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl w-full mx-auto grid md:grid-cols-2 gap-8 p-4 sm:p-8 z-10">
        {/* Login Card Section */}
        <div className={`backdrop-blur-sm bg-white/80 p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="ml-3 text-2xl font-heading font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">GrowSchool</span>
          </div>
          
          <div className="mb-6">
            <h3 className="text-center font-medium text-neutral-dark">School Management System</h3>
          </div>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access the school behavior platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-darker font-medium">Username</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <User className="h-5 w-5" />
                              </div>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                className="h-11 pl-10 border-neutral/30 focus:border-primary focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                              />
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-darker font-medium">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Lock className="h-5 w-5" />
                              </div>
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password" 
                                {...field} 
                                className="h-11 pl-10 pr-10 border-neutral/30 focus:border-primary focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                              />
                              <div 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </div>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                    <label
                      htmlFor="remember-me"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-primary text-white font-medium text-base"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>Log In <ChevronRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center pt-2 pb-4">
              <p className="text-sm text-gray-500">
                Please contact your administrator if you need an account
              </p>
            </CardFooter>
          </Card>
        </div>
        
        {/* Hero/Information Section */}
        <div className={`hidden md:flex flex-col justify-center relative transition-all duration-1000 delay-300 ${fadeIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-20 h-80 bg-gradient-to-t from-transparent via-white/20 to-transparent blur-xl rounded-full"></div>
          
          <h1 className="text-5xl font-heading font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">GrowSchool</span>
            <span className="block text-3xl mt-2 text-neutral-darker">{typedText}</span>
          </h1>
          
          <p className="text-lg text-neutral-dark mb-10 max-w-lg">
            Engage students, track behavior, and create a positive learning environment with our comprehensive behavior management system.
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            <div className={`flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px] ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700 delay-500`}>
              <Award className="h-14 w-14 text-blue-600 mr-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-darker mb-2">Recognize Achievement</h3>
                <p className="text-neutral-dark">Celebrate and reward positive student behavior with our customizable point system.</p>
              </div>
            </div>
            
            <div className={`flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px] ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700 delay-700`}>
              <Trophy className="h-14 w-14 text-indigo-600 mr-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-darker mb-2">Pod Competition</h3>
                <p className="text-neutral-dark">Foster school spirit and teamwork through engaging pod-based competitions.</p>
              </div>
            </div>
            
            <div className={`flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px] ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700 delay-900`}>
              <CheckCircle className="h-14 w-14 text-green-600 mr-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-darker mb-2">Data-Driven Insights</h3>
                <p className="text-neutral-dark">Access comprehensive analytics and reports to track student growth over time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
