import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, Bold, Italic, Link as LinkIcon, Image, Wand2, Target, Palette, 
  Building2, MessageSquare, Megaphone, Sparkles, Type, ImagePlus, Video,
  Camera, Globe, Brush, Sun, Upload, Play, Trash2, Send, Clock, Film,
  Music, Mic, Aperture, Zap, Layers, Monitor, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PlatformSelector from "../components/content/platform-selector";
import AiSuggestions from "../components/content/ai-suggestions";

export default function CreateContent() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [scheduleOption, setScheduleOption] = useState("approval");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  
  // Content type selection
  const [contentType, setContentType] = useState("text-image");
  
  // Enhanced AI input fields
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("professional");
  const [keyMessages, setKeyMessages] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [isAdvertisement, setIsAdvertisement] = useState(true);
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Image generation fields
  const [visualStyle, setVisualStyle] = useState("modern");
  const [colorScheme, setColorScheme] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [cameraAngle, setCameraAngle] = useState("eye-level");
  const [environment, setEnvironment] = useState("studio");
  const [lighting, setLighting] = useState("natural");
  const [mood, setMood] = useState("bright");
  const [composition, setComposition] = useState("rule-of-thirds");
  const [objectFocus, setObjectFocus] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageResolution, setImageResolution] = useState("1080p");
  
  // Video generation fields
  const [videoDuration, setVideoDuration] = useState("15");
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [videoTransitions, setVideoTransitions] = useState("smooth");
  const [videoMusic, setVideoMusic] = useState("upbeat");
  const [videoVoiceover, setVideoVoiceover] = useState("none");
  const [videoPacing, setVideoPacing] = useState("medium");
  const [videoEffects, setVideoEffects] = useState("minimal");
  const [videoFrameRate, setVideoFrameRate] = useState("30fps");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoScenes, setVideoScenes] = useState("");
  const [videoScript, setVideoScript] = useState("");
  
  // Preview states
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  
  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: scheduleOption === "approval" 
          ? "Your post has been sent to the approval queue!" 
          : "Your post has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/pending"] });
      // Reset form
      resetForm();
      // Reset to approval queue after successful submission
      setScheduleOption("approval");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateAiContentMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/ai/text", {
        prompt: `Create a ${params.brandTone || 'professional'} social media post for ${params.platform || 'Instagram'} about: ${params.businessName} ${params.productName || ''} - ${params.callToAction || 'promotion'}. Include ${params.includeHashtags ? 'hashtags' : 'no hashtags'} and ${params.includeEmojis ? 'emojis' : 'no emojis'}.`,
        system: "You write punchy, on-brand social media captions.",
        temperature: 0.9,
        maxOutputTokens: 2048
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.text) {
        setContent(data.text);
      }
      toast({
        title: "Content Generated",
        description: "AI has created optimized content for your platforms",
      });
    },
    onError: (error: any) => {
      console.error('AI generation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (params: any) => {
      const prompt = params.imagePrompt || 
        `Photoreal ${params.businessName || ''} ${params.productName || ''} ${params.visualStyle || 'modern'} ${params.environment || ''} ${params.mood || ''}, golden hour, steam`;
      
      const aspectRatioMap: Record<string, string> = {
        "Instagram": "1:1",
        "Facebook": "16:9",
        "X.com": "16:9",
        "TikTok": "9:16",
        "LinkedIn": "16:9"
      };
      
      const response = await apiRequest("POST", "/api/ai/image", {
        prompt: prompt.trim(),
        aspectRatio: aspectRatioMap[selectedPlatforms[0]] || "1:1",
        count: 1,
        negativePrompt: "blurry, watermark, low quality"
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.images && data.images[0]) {
        setGeneratedImage(data.images[0]);
      }
      toast({
        title: "Image Generated",
        description: "AI has created a custom image for your content (SynthID watermarked)",
      });
    },
    onError: (error: any) => {
      console.error('Image generation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (params: any) => {
      const prompt = params.videoScript || 
        `Cinematic close-up of ${params.businessName || ''} ${params.productName || ''} in slow motion, soft jazz, ${params.videoStyle || 'professional'} style`;
      
      const aspectRatio = selectedPlatforms[0] === "TikTok" ? "9:16" : "16:9";
      
      // Start video generation
      const startResponse = await apiRequest("POST", "/api/ai/video/start", {
        prompt: prompt.trim(),
        aspectRatio,
        fast: true, // Use fast model for quicker generation
        negativePrompt: "blurry, low quality"
      });
      const { operationName } = await startResponse.json();
      
      // Poll for completion
      let downloadUrl = "";
      let attempts = 0;
      while (attempts < 30) { // Max 30 attempts (2.5 minutes)
        await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`/api/ai/video/status/${encodeURIComponent(operationName)}`);
        const status = await statusResponse.json();
        
        if (status.done) {
          downloadUrl = status.downloadUrl;
          break;
        }
        attempts++;
      }
      
      if (!downloadUrl) {
        throw new Error("Video generation timed out");
      }
      
      return { videoUrl: downloadUrl };
    },
    onSuccess: (data) => {
      setGeneratedVideo(data.videoUrl);
      toast({
        title: "Video Generated",
        description: "AI has created a custom 8-second video with audio",
      });
    },
    onError: (error: any) => {
      console.error('Video generation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendToApprovalQueueMutation = useMutation({
    mutationFn: async (mediaData: any) => {
      return apiRequest("POST", "/api/posts/approval-queue", mediaData);
    },
    onSuccess: () => {
      toast({
        title: "Sent to Approval Queue",
        description: "Media has been sent for approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send to approval queue",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setContent("");
    setSelectedPlatforms(["Instagram", "Facebook"]);
    setScheduleOption("approval");
    setShowAiSuggestions(false);
    setAiSuggestions([]);
    setBusinessName("");
    setProductName("");
    setTargetAudience("");
    setKeyMessages("");
    setCallToAction("");
    setAdditionalContext("");
    setImagePrompt("");
    setColorScheme("");
    setObjectFocus("");
    setVideoScenes("");
    setVideoScript("");
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setUploadedImage(null);
    setUploadedVideo(null);
  };

  const handleSubmit = () => {
    if (!content.trim() && !businessName.trim()) {
      toast({
        title: "Error",
        description: "Please enter content or fill in business details for AI generation.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    const status = scheduleOption === "approval" ? "pending" : "scheduled";

    createPostMutation.mutate({
      content,
      platforms: selectedPlatforms,
      status,
      aiGenerated: true,
      contentType,
      imageUrl: uploadedImage || generatedImage,
      videoUrl: uploadedVideo || generatedVideo,
      scheduledFor: scheduleOption === "later" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      metadata: {
        businessName,
        productName,
        targetAudience,
        brandTone,
        keyMessages,
        callToAction,
        isAdvertisement,
        visualStyle,
        colorScheme,
        imagePrompt,
        cameraAngle,
        environment,
        lighting,
        mood,
        composition,
        objectFocus,
        aspectRatio,
        imageResolution,
        videoDuration,
        videoStyle,
        videoTransitions,
        videoMusic,
        videoVoiceover,
        videoPacing,
        videoEffects,
        videoFrameRate,
        videoResolution,
        videoAspectRatio,
        videoScenes,
        videoScript,
      }
    });
  };

  const handleAiGenerate = () => {
    if (!businessName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter at least your business name to generate content.",
        variant: "destructive",
      });
      return;
    }

    generateAiContentMutation.mutate({
      businessName,
      productName,
      targetAudience,
      brandTone,
      keyMessages: keyMessages.split(',').map(k => k.trim()).filter(k => k),
      callToAction,
      platform: selectedPlatforms[0] || 'Instagram',
      isAdvertisement,
      additionalContext,
      contentType,
    });
  };

  const handleGenerateImage = () => {
    generateImageMutation.mutate({
      businessName,
      productName,
      visualStyle,
      colorScheme,
      cameraAngle,
      environment,
      lighting,
      mood,
      composition,
      objectFocus,
      aspectRatio,
      resolution: imageResolution,
      imagePrompt,
    });
  };

  const handleGenerateVideo = () => {
    generateVideoMutation.mutate({
      businessName,
      productName,
      videoDuration,
      videoStyle,
      videoTransitions,
      videoMusic,
      videoVoiceover,
      videoPacing,
      videoEffects,
      videoFrameRate,
      videoResolution,
      videoAspectRatio,
      videoScenes,
      videoScript,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedVideo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImageToApproval = () => {
    const imageToSend = uploadedImage || generatedImage;
    if (imageToSend) {
      sendToApprovalQueueMutation.mutate({
        type: 'image',
        url: imageToSend,
        businessName,
        platforms: selectedPlatforms,
      });
    }
  };

  const handleSendVideoToApproval = () => {
    const videoToSend = uploadedVideo || generatedVideo;
    if (videoToSend) {
      sendToApprovalQueueMutation.mutate({
        type: 'video',
        url: videoToSend,
        businessName,
        platforms: selectedPlatforms,
      });
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setContent(suggestion);
    setShowAiSuggestions(false);
  };

  return (
    <div className="p-6 tech-grid">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display">Create Content</h1>
            <p className="text-muted-foreground mt-2">
              Generate AI-powered content optimized for your business and target audience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Platforms - Now at top */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Target Platforms
                </CardTitle>
                <CardDescription>
                  Select the social media platforms for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformSelector 
                  selectedPlatforms={selectedPlatforms}
                  onPlatformsChange={setSelectedPlatforms}
                />
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Provide details about your business for personalized content generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Sarah's Coffee Shop"
                      className="mt-1"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productName">Product/Service</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Organic Coffee Blend"
                      className="mt-1"
                      data-testid="input-product-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Young professionals, coffee enthusiasts, eco-conscious consumers"
                    className="mt-1"
                    data-testid="input-target-audience"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandTone">Brand Tone</Label>
                    <Select value={brandTone} onValueChange={setBrandTone}>
                      <SelectTrigger className="mt-1" data-testid="select-brand-tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly & Casual</SelectItem>
                        <SelectItem value="luxurious">Luxurious & Premium</SelectItem>
                        <SelectItem value="playful">Playful & Fun</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="urgent">Urgent & Action-Oriented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="callToAction">Call to Action</Label>
                    <Input
                      id="callToAction"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g., Shop Now, Learn More, Get 20% Off"
                      className="mt-1"
                      data-testid="input-call-to-action"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="keyMessages">Key Messages (comma-separated)</Label>
                  <Textarea
                    id="keyMessages"
                    value={keyMessages}
                    onChange={(e) => setKeyMessages(e.target.value)}
                    placeholder="e.g., Free shipping on orders over $50, Eco-friendly packaging, Award-winning quality"
                    className="mt-1 h-20"
                    data-testid="textarea-key-messages"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAdvertisement"
                      checked={isAdvertisement}
                      onCheckedChange={setIsAdvertisement}
                      data-testid="switch-advertisement"
                    />
                    <Label htmlFor="isAdvertisement" className="cursor-pointer">
                      Structure as Advertisement
                    </Label>
                  </div>
                  <Badge variant={isAdvertisement ? "default" : "secondary"} className="pulse-glow">
                    {isAdvertisement ? "Ad Format" : "Organic Content"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Content Type Selection */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  Content Type
                </CardTitle>
                <CardDescription>
                  Choose what type of content you want to create
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setContentType("text")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === "text" 
                        ? "border-primary bg-primary/10 neon-glow" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="button-content-text"
                  >
                    <Type className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Text Only</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Caption & copy
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setContentType("text-image")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === "text-image" 
                        ? "border-primary bg-primary/10 neon-glow" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="button-content-text-image"
                  >
                    <ImagePlus className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Text + Image</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Visual content
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setContentType("text-video")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === "text-video" 
                        ? "border-primary bg-primary/10 neon-glow" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="button-content-text-video"
                  >
                    <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Text + Video</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Dynamic content
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Image Creator - Only show for image content */}
            {contentType === "text-image" && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Image Creator
                  </CardTitle>
                  <CardDescription>
                    Generate or upload custom images for your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Image Generation Settings</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => imageInputRef.current?.click()}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        onClick={handleGenerateImage}
                        disabled={generateImageMutation.isPending}
                        size="sm"
                        className="neon-glow"
                        data-testid="button-generate-image"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        {generateImageMutation.isPending ? "Generating..." : "Generate Image"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="visualStyle">Visual Style</Label>
                      <Select value={visualStyle} onValueChange={setVisualStyle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern & Clean</SelectItem>
                          <SelectItem value="vintage">Vintage & Retro</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="bold">Bold & Vibrant</SelectItem>
                          <SelectItem value="elegant">Elegant & Sophisticated</SelectItem>
                          <SelectItem value="playful">Playful & Colorful</SelectItem>
                          <SelectItem value="professional">Professional & Corporate</SelectItem>
                          <SelectItem value="artistic">Artistic & Abstract</SelectItem>
                          <SelectItem value="realistic">Photo-Realistic</SelectItem>
                          <SelectItem value="cartoon">Cartoon & Animated</SelectItem>
                          <SelectItem value="watercolor">Watercolor</SelectItem>
                          <SelectItem value="sketch">Sketch & Line Art</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="colorScheme">Color Scheme</Label>
                      <Input
                        id="colorScheme"
                        value={colorScheme}
                        onChange={(e) => setColorScheme(e.target.value)}
                        placeholder="e.g., Blue and gold, Earth tones"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="aspectRatio">
                        <Monitor className="w-4 h-4 inline mr-1" />
                        Aspect Ratio
                      </Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                          <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cameraAngle">
                        <Camera className="w-4 h-4 inline mr-1" />
                        Camera Angle
                      </Label>
                      <Select value={cameraAngle} onValueChange={setCameraAngle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eye-level">Eye Level</SelectItem>
                          <SelectItem value="low-angle">Low Angle</SelectItem>
                          <SelectItem value="high-angle">High Angle</SelectItem>
                          <SelectItem value="birds-eye">Bird's Eye View</SelectItem>
                          <SelectItem value="dutch-angle">Dutch Angle</SelectItem>
                          <SelectItem value="close-up">Close-Up</SelectItem>
                          <SelectItem value="wide-shot">Wide Shot</SelectItem>
                          <SelectItem value="extreme-close-up">Extreme Close-Up</SelectItem>
                          <SelectItem value="aerial">Aerial View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="environment">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Environment
                      </Label>
                      <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                          <SelectItem value="minimal">Minimal Background</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lighting">
                        <Sun className="w-4 h-4 inline mr-1" />
                        Lighting
                      </Label>
                      <Select value={lighting} onValueChange={setLighting}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural">Natural Light</SelectItem>
                          <SelectItem value="soft">Soft Lighting</SelectItem>
                          <SelectItem value="dramatic">Dramatic</SelectItem>
                          <SelectItem value="golden-hour">Golden Hour</SelectItem>
                          <SelectItem value="studio">Studio Lighting</SelectItem>
                          <SelectItem value="neon">Neon</SelectItem>
                          <SelectItem value="moody">Moody</SelectItem>
                          <SelectItem value="backlit">Backlit</SelectItem>
                          <SelectItem value="candlelight">Candlelight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="mood">
                        <Brush className="w-4 h-4 inline mr-1" />
                        Mood
                      </Label>
                      <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bright">Bright & Cheerful</SelectItem>
                          <SelectItem value="calm">Calm & Serene</SelectItem>
                          <SelectItem value="energetic">Energetic</SelectItem>
                          <SelectItem value="mysterious">Mysterious</SelectItem>
                          <SelectItem value="romantic">Romantic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="luxurious">Luxurious</SelectItem>
                          <SelectItem value="nostalgic">Nostalgic</SelectItem>
                          <SelectItem value="futuristic">Futuristic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="composition">Composition</Label>
                      <Select value={composition} onValueChange={setComposition}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rule-of-thirds">Rule of Thirds</SelectItem>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="symmetrical">Symmetrical</SelectItem>
                          <SelectItem value="asymmetrical">Asymmetrical</SelectItem>
                          <SelectItem value="diagonal">Diagonal</SelectItem>
                          <SelectItem value="golden-ratio">Golden Ratio</SelectItem>
                          <SelectItem value="leading-lines">Leading Lines</SelectItem>
                          <SelectItem value="framing">Framing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="imageResolution">
                        <Aperture className="w-4 h-4 inline mr-1" />
                        Resolution
                      </Label>
                      <Select value={imageResolution} onValueChange={setImageResolution}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="2k">2K</SelectItem>
                          <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                          <SelectItem value="8k">8K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="objectFocus">Object/Subject Focus</Label>
                    <Input
                      id="objectFocus"
                      value={objectFocus}
                      onChange={(e) => setObjectFocus(e.target.value)}
                      placeholder="e.g., Coffee cup on wooden table, Person using laptop"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imagePrompt">Additional Image Instructions</Label>
                    <Textarea
                      id="imagePrompt"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe specific visual elements, props, backgrounds, textures, or any other details you want in the image..."
                      className="mt-1 h-24"
                    />
                  </div>

                  {/* Image Preview Box */}
                  {(generatedImage || uploadedImage) && (
                    <div className="border border-primary/30 rounded-lg p-4 bg-background/50">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-sm">Image Preview</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSendImageToApproval}
                            disabled={sendToApprovalQueueMutation.isPending}
                            data-testid="button-send-image-approval"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send to Approval Queue
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setGeneratedImage(null);
                              setUploadedImage(null);
                            }}
                            data-testid="button-delete-image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={uploadedImage || generatedImage || ""} 
                          alt="Generated content" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video Creator - Only show for video content */}
            {contentType === "text-video" && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    Video Creator
                  </CardTitle>
                  <CardDescription>
                    Generate or upload custom videos for your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Video Generation Settings</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => videoInputRef.current?.click()}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                      <Button
                        onClick={handleGenerateVideo}
                        disabled={generateVideoMutation.isPending}
                        size="sm"
                        className="neon-glow"
                        data-testid="button-generate-video"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {generateVideoMutation.isPending ? "Generating..." : "Generate Video"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="videoDuration">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Duration
                      </Label>
                      <Select value={videoDuration} onValueChange={setVideoDuration}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoStyle">
                        <Brush className="w-4 h-4 inline mr-1" />
                        Video Style
                      </Label>
                      <Select value={videoStyle} onValueChange={setVideoStyle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                          <SelectItem value="documentary">Documentary</SelectItem>
                          <SelectItem value="animated">Animated</SelectItem>
                          <SelectItem value="motion-graphics">Motion Graphics</SelectItem>
                          <SelectItem value="slideshow">Slideshow</SelectItem>
                          <SelectItem value="stop-motion">Stop Motion</SelectItem>
                          <SelectItem value="time-lapse">Time Lapse</SelectItem>
                          <SelectItem value="vertical">Vertical (Stories)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoAspectRatio">
                        <Monitor className="w-4 h-4 inline mr-1" />
                        Aspect Ratio
                      </Label>
                      <Select value={videoAspectRatio} onValueChange={setVideoAspectRatio}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait/Stories)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="21:9">21:9 (Cinematic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="videoTransitions">
                        <Layers className="w-4 h-4 inline mr-1" />
                        Transitions
                      </Label>
                      <Select value={videoTransitions} onValueChange={setVideoTransitions}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smooth">Smooth Fade</SelectItem>
                          <SelectItem value="cut">Hard Cut</SelectItem>
                          <SelectItem value="dissolve">Dissolve</SelectItem>
                          <SelectItem value="wipe">Wipe</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="slide">Slide</SelectItem>
                          <SelectItem value="glitch">Glitch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoMusic">
                        <Music className="w-4 h-4 inline mr-1" />
                        Background Music
                      </Label>
                      <Select value={videoMusic} onValueChange={setVideoMusic}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                          <SelectItem value="calm">Calm & Relaxing</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="acoustic">Acoustic</SelectItem>
                          <SelectItem value="dramatic">Dramatic</SelectItem>
                          <SelectItem value="none">No Music</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoVoiceover">
                        <Mic className="w-4 h-4 inline mr-1" />
                        Voiceover
                      </Label>
                      <Select value={videoVoiceover} onValueChange={setVideoVoiceover}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Voiceover</SelectItem>
                          <SelectItem value="male-professional">Male Professional</SelectItem>
                          <SelectItem value="female-professional">Female Professional</SelectItem>
                          <SelectItem value="male-friendly">Male Friendly</SelectItem>
                          <SelectItem value="female-friendly">Female Friendly</SelectItem>
                          <SelectItem value="ai-generated">AI Generated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="videoPacing">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Pacing
                      </Label>
                      <Select value={videoPacing} onValueChange={setVideoPacing}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow & Steady</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="fast">Fast-Paced</SelectItem>
                          <SelectItem value="dynamic">Dynamic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoEffects">Effects</Label>
                      <Select value={videoEffects} onValueChange={setVideoEffects}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="subtle">Subtle</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="heavy">Heavy</SelectItem>
                          <SelectItem value="vintage">Vintage Filter</SelectItem>
                          <SelectItem value="black-white">Black & White</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="videoFrameRate">Frame Rate</Label>
                      <Select value={videoFrameRate} onValueChange={setVideoFrameRate}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24fps">24 fps (Cinematic)</SelectItem>
                          <SelectItem value="30fps">30 fps (Standard)</SelectItem>
                          <SelectItem value="60fps">60 fps (Smooth)</SelectItem>
                          <SelectItem value="120fps">120 fps (Slow Motion)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="videoResolution">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Resolution
                    </Label>
                    <Select value={videoResolution} onValueChange={setVideoResolution}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="2k">2K</SelectItem>
                        <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="videoScenes">Scene Descriptions</Label>
                    <Textarea
                      id="videoScenes"
                      value={videoScenes}
                      onChange={(e) => setVideoScenes(e.target.value)}
                      placeholder="Describe the scenes you want in your video, separated by commas (e.g., Product close-up, Customer testimonial, Logo animation)"
                      className="mt-1 h-20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="videoScript">Video Script/Narration</Label>
                    <Textarea
                      id="videoScript"
                      value={videoScript}
                      onChange={(e) => setVideoScript(e.target.value)}
                      placeholder="Write the script or narration for your video. Include any text overlays, captions, or dialogue..."
                      className="mt-1 h-24"
                    />
                  </div>

                  {/* Video Preview Box */}
                  {(generatedVideo || uploadedVideo) && (
                    <div className="border border-primary/30 rounded-lg p-4 bg-background/50">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-sm">Video Preview</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSendVideoToApproval}
                            disabled={sendToApprovalQueueMutation.isPending}
                            data-testid="button-send-video-approval"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send to Approval Queue
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setGeneratedVideo(null);
                              setUploadedVideo(null);
                            }}
                            data-testid="button-delete-video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        {uploadedVideo || generatedVideo ? (
                          <video 
                            src={uploadedVideo || generatedVideo || ""} 
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Play className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Text and Caption Editor */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Text and Caption Editor
                </CardTitle>
                <CardDescription>
                  Edit your generated content or write from scratch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
                  <Textarea
                    id="additionalContext"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any special instructions, current promotions, or specific details to include..."
                    className="mt-1 h-20"
                    data-testid="textarea-additional-context"
                  />
                </div>

                <div className="flex justify-between items-center mb-2">
                  <Label>Generated Content</Label>
                  <Button
                    onClick={handleAiGenerate}
                    disabled={generateAiContentMutation.isPending}
                    size="sm"
                    className="neon-glow"
                    data-testid="button-generate-content"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateAiContentMutation.isPending ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
                
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b border-border flex items-center space-x-2 text-sm">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="border-0 resize-none h-40 focus-visible:ring-0"
                    placeholder="Your AI-generated content will appear here. You can also type or edit manually..."
                    data-testid="textarea-content"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Publishing Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={scheduleOption}
                  onValueChange={setScheduleOption}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="later" id="later" />
                    <Label htmlFor="later">Schedule for Later</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approval" id="approval" />
                    <Label htmlFor="approval">Send to Approval Queue</Label>
                  </div>
                </RadioGroup>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={createPostMutation.isPending}
                  className="w-full neon-glow"
                  size="lg"
                  data-testid="button-create-post"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  {createPostMutation.isPending ? "Creating..." : 
                   scheduleOption === "approval" ? "Send to Approval Queue" : "Schedule Post"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {showAiSuggestions && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <AiSuggestions
                    suggestions={aiSuggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}