import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Chrome, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrerName, setReferrerName] = useState<string>("");
  const [oauthError, setOauthError] = useState<string>("");
  
  // Parse return URL, referral code, and OAuth errors from query params
  const params = new URLSearchParams(location.split('?')[1] || '');
  const returnUrl = params.get('return') ? decodeURIComponent(params.get('return')!) : '/';
  const refCode = params.get('ref') || '';
  const errorParam = params.get('error') || '';
  const errorDetails = params.get('details') || '';
  
  // Handle OAuth errors and validate referral code on component mount
  useEffect(() => {
    // Handle OAuth errors
    if (errorParam) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch(errorParam) {
        case 'oauth_failed':
          errorMessage = 'Google authentication failed. Please try again.';
          break;
        case 'no_user_object':
          errorMessage = 'Failed to retrieve user information from Google. Please try again.';
          break;
        case 'session_save_failed':
        case 'session_failed':
          errorMessage = 'Failed to create session. Please try again or use email/password login.';
          break;
        case 'csrf_state_mismatch':
          errorMessage = 'Security verification failed. Please try again.';
          break;
        case 'google_oauth_error':
          errorMessage = `Google authentication error: ${errorDetails || 'Unknown error'}`;
          break;
        case 'google_auth_failed':
          errorMessage = 'Google authentication was cancelled or failed. Please try again.';
          break;
        case 'passport_auth_failed':
          errorMessage = `Authentication failed: ${errorDetails || 'Please try again'}`;
          break;
        case 'callback_exception':
          errorMessage = 'An error occurred during authentication. Please try again.';
          break;
        case 'no_user':
          errorMessage = 'Authentication successful but user not found. Please sign up first.';
          break;
        case 'invalid_user':
          errorMessage = 'Invalid user data received from Google. Please try again.';
          break;
      }
      
      setOauthError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    // Handle referral code
    if (refCode) {
      setReferralCode(refCode);
      setTab('signup'); // Switch to signup tab if referral code is present
      
      // Validate the referral code
      fetch(`/api/referral/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: refCode }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setReferrerName(data.referrerName || "");
            toast({
              title: "Referral Applied!",
              description: `You were referred by ${data.referrerName}. You'll get 25 bonus credits when you sign up!`,
            });
          }
        })
        .catch(() => {});
    }
  }, [refCode, errorParam, errorDetails, toast]);
  
  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Signup form
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      businessName: "",
      referralCode: refCode || "",
    },
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        // Redirect to verification page
        localStorage.setItem("verificationEmail", data.email);
        toast({
          title: "Email verification required",
          description: "Please verify your email to access your account.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        setLocation(returnUrl);
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data || error;
      
      if (errorData.requiresVerification) {
        // Email not verified - redirect to verification
        localStorage.setItem("verificationEmail", errorData.email);
        toast({
          title: "Email verification required",
          description: errorData.message || "Please verify your email before logging in.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(errorData.email)}`);
      } else {
        toast({
          title: "Login failed",
          description: errorData.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    },
  });
  
  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      const response = await apiRequest("POST", "/api/auth/signup", signupData);
      const result = await response.json();
      
      // Process referral if code was provided
      if (signupData.referralCode && result.userId) {
        try {
          await apiRequest("POST", "/api/referral/process", {
            referralCode: signupData.referralCode,
            newUserId: result.userId,
          });
        } catch (error) {
          console.error("Failed to process referral:", error);
        }
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        // New account needs email verification
        localStorage.setItem("verificationEmail", data.email);
        toast({
          title: "Account created!",
          description: data.message || "Please check your email for verification code.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Account created!",
          description: "Welcome to MyAI MediaMgr. Your free trial has started.",
        });
        // New accounts go to trial selection, unless they have a specific return URL for checkout
        setLocation(returnUrl.includes('/checkout') ? returnUrl : "/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });
  
  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google?return=${encodeURIComponent(returnUrl)}`;
  };
  
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };
  
  const onSignupSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            MyAI MediaMgr
          </h1>
          <p className="text-gray-400">AI-powered social media management</p>
        </div>
        
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {oauthError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            )}
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="you@example.com"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-login-email"
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
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="••••••••"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={signupForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="John"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                                data-testid="input-signup-firstname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Doe"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                                data-testid="input-signup-lastname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="you@example.com"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-signup-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="johndoe"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-signup-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Business Name (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Your Business"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-signup-business"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {referralCode && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-400">
                          {referrerName ? 
                            `✨ Referred by ${referrerName}! You'll get 25 bonus credits when you sign up.` :
                            `✨ Referral code applied! You'll get 25 bonus credits when you sign up.`
                          }
                        </p>
                        <FormField
                          control={signupForm.control}
                          name="referralCode"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={referralCode}
                                  readOnly
                                  className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                  data-testid="input-signup-referral"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="••••••••"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-signup-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="••••••••"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              data-testid="input-signup-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={signupMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signupMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/5 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={handleGoogleLogin}
              data-testid="button-google-login"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
            
            <Alert className="mt-4 bg-green-500/10 border-green-500/30">
              <AlertCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Start your 7-day free trial. No credit card required.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}