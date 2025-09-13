import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw, Clock, Shield } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Get email from localStorage or query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const storedEmail = localStorage.getItem("verificationEmail");
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem("verificationEmail", emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Check verification status
  const { data: statusData } = useQuery({
    queryKey: ["/api/verification/verification-status", email],
    queryFn: async () => {
      if (!email) return null;
      const response = await fetch(`/api/verification/verification-status?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error("Failed to check status");
      return response.json();
    },
    enabled: !!email,
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Update code expiry from status
  useEffect(() => {
    if (statusData?.expiresAt) {
      setCodeExpiry(new Date(statusData.expiresAt));
    }
  }, [statusData]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (!codeExpiry) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = codeExpiry.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Code expired");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [codeExpiry]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Send verification code mutation
  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/verification/send-verification", { email });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code sent!",
        description: `A new verification code has been sent to ${email}`,
      });
      setResendCountdown(60); // 60 second cooldown
      if (data.expiresAt) {
        setCodeExpiry(new Date(data.expiresAt));
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Verify email mutation
  const verifyMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const response = await apiRequest("POST", "/api/verification/verify-email", {
        email,
        code: verificationCode,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified. Welcome to MyAI MediaMgr!",
      });
      localStorage.removeItem("verificationEmail");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: any) => {
      const errorData = error.response?.data || error;
      
      if (errorData.requiresNewCode) {
        setCode(["", "", "", "", "", ""]);
        setCodeExpiry(null);
      }
      
      toast({
        title: "Verification failed",
        description: errorData.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (i < 6 && /^\d$/.test(digit)) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);
      
      // Move focus to the last filled input or the first empty one
      const nextEmpty = newCode.findIndex((d) => d === "");
      const nextFocus = nextEmpty === -1 ? 5 : nextEmpty;
      setFocusedIndex(nextFocus);
      
      // Auto-submit if all digits are filled
      if (newCode.every((d) => d !== "")) {
        verifyMutation.mutate(newCode.join(""));
      }
    } else if (/^\d$/.test(value)) {
      // Single digit input
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Move to next input
      if (index < 5) {
        setFocusedIndex(index + 1);
      }
      
      // Auto-submit if all digits are filled
      if (index === 5 && newCode.every((d) => d !== "")) {
        verifyMutation.mutate(newCode.join(""));
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      setFocusedIndex(index + 1);
    } else if (e.key === "Enter") {
      const fullCode = code.join("");
      if (fullCode.length === 6) {
        verifyMutation.mutate(fullCode);
      }
    }
  };

  // Focus management
  useEffect(() => {
    const input = document.getElementById(`code-input-${focusedIndex}`);
    if (input) {
      (input as HTMLInputElement).focus();
    }
  }, [focusedIndex]);

  // Check if already verified
  useEffect(() => {
    if (statusData?.emailVerified) {
      toast({
        title: "Already verified",
        description: "Your email is already verified. Redirecting...",
      });
      setTimeout(() => setLocation("/"), 2000);
    }
  }, [statusData, toast, setLocation]);

  const isLoading = sendCodeMutation.isPending || verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-400">
            Enter the 6-digit code we sent to<br />
            <span className="text-white font-medium">{email || "your email"}</span>
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Verification Code
            </CardTitle>
            <CardDescription className="text-gray-400">
              Please enter the verification code to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code expiry timer */}
            {timeRemaining && codeExpiry && new Date() < codeExpiry && (
              <Alert className="bg-purple-900/20 border-purple-800">
                <Clock className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200">
                  Code expires in: <span className="font-mono font-bold">{timeRemaining}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Code input fields */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => setFocusedIndex(index)}
                  className="w-12 h-12 text-center text-xl font-mono bg-white/10 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400"
                  disabled={isLoading}
                  data-testid={`input-code-${index}`}
                />
              ))}
            </div>

            {/* Error message for expired code */}
            {timeRemaining === "Code expired" && (
              <Alert className="bg-red-900/20 border-red-800">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Your verification code has expired. Please request a new one.
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => verifyMutation.mutate(code.join(""))}
                disabled={isLoading || code.some((d) => !d)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Email
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => sendCodeMutation.mutate()}
                disabled={isLoading || resendCountdown > 0}
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                data-testid="button-resend"
              >
                {sendCodeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Resend in {resendCountdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            {/* Help text */}
            <div className="text-center text-sm text-gray-400">
              <p>Didn't receive the email?</p>
              <p className="mt-1">
                Check your spam folder or{" "}
                <button
                  onClick={() => setLocation("/auth")}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  try a different email
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>We verify your email to keep your account secure.</p>
          <p>Never share your verification code with anyone.</p>
        </div>
      </div>
    </div>
  );
}