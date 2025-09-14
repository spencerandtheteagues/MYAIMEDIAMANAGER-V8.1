import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User,
  Loader2,
  Copy,
  RotateCcw,
  AlertCircle,
  Zap,
  TrendingUp,
  Hash,
  Calendar,
  Target,
  Lightbulb,
  MessageSquare,
  Video,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  CreditCard,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: "openai" | "gemini";
}

interface QuickPrompt {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  category: string;
}

const quickPrompts: QuickPrompt[] = [
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Viral Hook",
    prompt: "Help me create a viral hook for my next post about [topic]. Give me 5 attention-grabbing opening lines.",
    category: "content"
  },
  {
    icon: <Hash className="w-4 h-4" />,
    label: "Trending Hashtags",
    prompt: "What are the best hashtags for [industry/topic] right now? Give me 30 relevant hashtags organized by reach potential.",
    category: "optimization"
  },
  {
    icon: <Calendar className="w-4 h-4" />,
    label: "Content Calendar",
    prompt: "Create a 7-day content calendar for [business type] with daily post ideas, best times to post, and content themes.",
    category: "planning"
  },
  {
    icon: <Target className="w-4 h-4" />,
    label: "Audience Analysis",
    prompt: "Help me understand my target audience better. My business is [type] and I want to reach [demographic]. What content resonates with them?",
    category: "strategy"
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    label: "Creative Ideas",
    prompt: "Give me 10 creative content ideas for [platform] that will engage my audience and showcase [product/service].",
    category: "content"
  },
  {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Caption Writing",
    prompt: "Write 3 engaging captions for a post about [topic]. Include a hook, value proposition, and call-to-action.",
    category: "content"
  },
  {
    icon: <Video className="w-4 h-4" />,
    label: "Video Script",
    prompt: "Create a 30-second video script for [platform] about [topic]. Include hook, main points, and strong CTA.",
    category: "content"
  },
  {
    icon: <ImageIcon className="w-4 h-4" />,
    label: "Visual Ideas",
    prompt: "Suggest 5 visual content ideas for [topic] that will stop the scroll and generate engagement.",
    category: "content"
  },
  {
    icon: <FileText className="w-4 h-4" />,
    label: "Blog to Social",
    prompt: "Turn this blog post idea into 5 different social media posts, each optimized for a different platform: [blog topic]",
    category: "repurposing"
  },
  {
    icon: <Zap className="w-4 h-4" />,
    label: "Engagement Boost",
    prompt: "My posts aren't getting enough engagement. Analyze this post and suggest improvements: [paste your post]",
    category: "optimization"
  }
];

export default function AIBrainstorm() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"openai" | "gemini">("openai");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user data to get credit balance
  const { data: user, refetch: refetchUser } = useQuery<{
    id: string;
    email: string;
    credits: number;
    tier?: string;
    isPaid?: boolean;
  }>({
    queryKey: ["/api/user"],
  });

  const credits = user?.credits || 0;
  const hasCredits = credits > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    setStreamedContent("");

    try {
      const endpoint = selectedModel === "openai" 
        ? "/api/ai-chat/openai" 
        : "/api/ai-chat/gemini";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle insufficient credits (402 Payment Required)
        if (response.status === 402) {
          const errorWithCredits = {
            ...error,
            status: 402,
            isInsufficientCredits: true
          };
          throw errorWithCredits;
        }
        
        throw new Error(error.message || `Server responded with ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
              } else {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || parsed.text || "";
                  fullContent += content;
                  setStreamedContent(fullContent);
                } catch (e) {
                  // Handle non-JSON chunks or parsing errors
                  console.error('Parse error:', e);
                }
              }
            }
          }
        }
      }

      // Add the complete assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: fullContent || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        model: selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamedContent("");
      
      // Refetch user data to update credit balance after successful message
      refetchUser();
      
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Failed to get response. ";
      let showUpgradeLink = false;
      
      // Handle insufficient credits error
      if (error.isInsufficientCredits || error.status === 402) {
        errorMessage = error.message || "Insufficient credits. You need at least 1 credit to send a message.";
        showUpgradeLink = true;
        
        // Update credit balance from error response if available
        if (error.credits !== undefined) {
          refetchUser();
        }
      } else if (error.message?.includes("API key")) {
        errorMessage += `${selectedModel === "openai" ? "OpenAI" : "Gemini"} API key is not configured. Please add it in Settings.`;
      } else if (error.message?.includes("Authentication")) {
        errorMessage += "Please log in to use the AI chat feature.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      toast({
        title: error.isInsufficientCredits ? "Insufficient Credits" : "Chat Error",
        description: (
          <div className="space-y-2">
            <p>{errorMessage}</p>
            {showUpgradeLink && (
              <Link href="/billing">
                <Button variant="link" className="p-0 h-auto text-blue-500">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Purchase more credits
                </Button>
              </Link>
            )}
          </div>
        ),
        variant: "destructive",
      });

      // Add error message to chat
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        model: selectedModel
      };
      setMessages(prev => [...prev, errorMsg]);
      
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "The message has been copied to your clipboard.",
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setStreamedContent("");
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredPrompts = selectedCategory === "all" 
    ? quickPrompts 
    : quickPrompts.filter(p => p.category === selectedCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            AI Content Brainstorm
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with ChatGPT-5 or Gemini 2.5 Pro to brainstorm viral social media content
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Credit Balance Display */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Credits</p>
                <p className="text-2xl font-bold">
                  {user ? credits.toLocaleString() : "--"}
                </p>
              </div>
              {credits === 0 && (
                <Link href="/billing">
                  <Button variant="destructive" size="sm">
                    <Zap className="w-4 h-4 mr-1" />
                    Buy Credits
                  </Button>
                </Link>
              )}
            </div>
          </Card>
          
          {/* Model Selector */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="model-switch" className="text-sm font-medium">
                AI Model:
              </Label>
              <div className="flex items-center space-x-2">
                <Badge variant={selectedModel === "openai" ? "default" : "outline"}>
                  ChatGPT-5
                </Badge>
                <Switch
                  id="model-switch"
                  checked={selectedModel === "gemini"}
                  onCheckedChange={(checked) => setSelectedModel(checked ? "gemini" : "openai")}
                />
                <Badge variant={selectedModel === "gemini" ? "default" : "outline"}>
                  Gemini 2.5 Pro
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Chat with {selectedModel === "openai" ? "ChatGPT-5" : "Gemini 2.5 Pro"}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={messages.length === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {messages.length === 0 && !isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Bot className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        Start a conversation
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ask me anything about social media content, strategies, or trends!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            {message.role === "user" ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </Avatar>
                          
                          <div className="space-y-2">
                            <Card
                              className={`p-4 ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            </Card>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(message.timestamp, "h:mm a")}</span>
                              {message.model && (
                                <Badge variant="outline" className="text-xs">
                                  {message.model === "openai" ? "ChatGPT" : "Gemini"}
                                </Badge>
                              )}
                              {message.role === "assistant" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => handleCopyMessage(message.content)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Streaming content */}
                    {isStreaming && streamedContent && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="w-8 h-8">
                          <Bot className="w-4 h-4" />
                        </Avatar>
                        <Card className="p-4 bg-muted max-w-[80%]">
                          <div className="whitespace-pre-wrap">{streamedContent}</div>
                          <Loader2 className="w-4 h-4 animate-spin mt-2" />
                        </Card>
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {isLoading && !streamedContent && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="w-8 h-8">
                          <Bot className="w-4 h-4" />
                        </Avatar>
                        <Card className="p-4 bg-muted">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </Card>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            
            {/* Message Input */}
            <div className="border-t p-4">
              {/* Credit cost indicator */}
              {!hasCredits && (
                <Alert className="mb-3" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You have no credits. Purchase credits to continue chatting.</span>
                    <Link href="/billing">
                      <Button variant="link" size="sm" className="text-blue-500">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Buy Credits
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={hasCredits 
                      ? "Ask about content ideas, strategies, hashtags, or anything social media related..."
                      : "Purchase credits to start chatting..."
                    }
                    className="min-h-[60px]"
                    disabled={isLoading || !hasCredits}
                  />
                  {hasCredits && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      <span>1 credit will be charged per message</span>
                    </div>
                  )}
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading || !hasCredits}
                        className="px-6"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {hasCredits && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                -1
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!hasCredits 
                        ? "No credits available" 
                        : "Send message (1 credit)"
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Prompts Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="strategy">Strategy</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">{prompt.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{prompt.label}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {prompt.prompt}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      </div>
                    </Button>
                  ))}
                </TabsContent>
                
                <TabsContent value="content" className="space-y-2">
                  {quickPrompts
                    .filter(p => p.category === "content")
                    .map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">{prompt.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{prompt.label}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </Button>
                    ))}
                </TabsContent>
                
                <TabsContent value="strategy" className="space-y-2">
                  {quickPrompts
                    .filter(p => ["strategy", "planning", "optimization"].includes(p.category))
                    .map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">{prompt.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{prompt.label}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </Button>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Be specific! Include your industry, target audience, and goals for better results.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Ask for multiple variations to A/B test</p>
                <p>• Request platform-specific optimizations</p>
                <p>• Include your brand voice and tone</p>
                <p>• Ask for hashtag recommendations</p>
                <p>• Request engagement strategies</p>
              </div>
              
              {/* Credit info */}
              <Alert className="mt-4">
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Credit Usage</p>
                    <p className="text-xs">Each message costs 1 credit</p>
                    {credits < 5 && credits > 0 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Low balance: {credits} credits remaining
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}