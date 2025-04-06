import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Redirect } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { insertUserSchema, userRoles } from '@shared/schema';
import { Loader2, Award, Trophy, Star, CheckCircle, Users, ChevronRight } from 'lucide-react';

export default function AuthPage() {
  const [location] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const registerFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    role: z.enum(userRoles),
    gradeLevel: z.string().optional(),
    section: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
      gradeLevel: "",
      section: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    } as any); // Cast to any to work around type issues
  };

  const onRegisterSubmit = (values: z.infer<typeof registerFormSchema>) => {
    const { confirmPassword, ...registrationData } = values;
    
    // Create the user object with properly typed fields
    const userData = {
      ...registrationData,
      // Set null values for optional fields if they're empty
      gradeLevel: registrationData.gradeLevel || null,
      section: registrationData.section || null,
      // Initialize other required fields with default values
      houseId: null,
      parentId: null
    };
    
    registerMutation.mutate(userData as any); // Cast to any to work around type issues
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
        <div className="backdrop-blur-sm bg-white/80 p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="ml-3 text-2xl font-heading font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">GrowSchool</span>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                              />
                            </FormControl>
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
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium text-base"
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
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:text-primary/80"
                  >
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Create an Account</CardTitle>
                  <CardDescription className="text-base">
                    Join the GrowSchool platform to manage student behavior.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-darker font-medium">First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="First name" 
                                  {...field} 
                                  className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-darker font-medium">Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Last name" 
                                  {...field} 
                                  className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-darker font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-darker font-medium">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                                className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-darker font-medium">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Create a password" 
                                  {...field} 
                                  className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-darker font-medium">Confirm Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Confirm password" 
                                  {...field} 
                                  className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-darker font-medium">Role</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 border-neutral/30 focus:ring-primary/20">
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {userRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {registerForm.watch("role") === "student" && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="gradeLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-darker font-medium">Grade Level</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. 8" 
                                    {...field} 
                                    className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="section"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-darker font-medium">Section</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. A" 
                                    {...field} 
                                    className="h-11 border-neutral/30 focus:border-primary focus:ring-primary/20"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium text-base"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>Create Account <ChevronRight className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center pt-2 pb-4">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:text-primary/80"
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Hero/Information Section */}
        <div className="hidden md:flex flex-col justify-center relative">
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-20 h-80 bg-gradient-to-t from-transparent via-white/20 to-transparent blur-xl rounded-full"></div>
          
          <h1 className="text-5xl font-heading font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">GrowSchool</span>
            <span className="block text-3xl mt-2 text-neutral-darker">Student Growth Platform</span>
          </h1>
          
          <p className="text-lg text-neutral-dark mb-10 max-w-lg">
            Engage students, track behavior, and create a positive learning environment with our comprehensive behavior management system.
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px]">
              <Award className="h-14 w-14 text-primary mr-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-darker mb-2">Recognize Achievement</h3>
                <p className="text-neutral-dark">Celebrate and reward positive student behavior with our customizable point system.</p>
              </div>
            </div>
            
            <div className="flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px]">
              <Trophy className="h-14 w-14 text-secondary mr-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-darker mb-2">House Competition</h3>
                <p className="text-neutral-dark">Foster school spirit and teamwork through engaging house-based competitions.</p>
              </div>
            </div>
            
            <div className="flex p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 transform transition-all hover:translate-y-[-5px]">
              <CheckCircle className="h-14 w-14 text-accent mr-6 flex-shrink-0" />
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
