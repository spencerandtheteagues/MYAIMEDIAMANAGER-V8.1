import { useState } from "react";
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
import { Bot, Bold, Italic, Link as LinkIcon, Image, Wand2, Target, Palette, Building2, MessageSquare, Megaphone, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PlatformSelector from "../components/content/platform-selector";
import AiSuggestions from "../components/content/ai-suggestions";

export default function CreateContent() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // Enhanced AI input fields
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("professional");
  const [keyMessages, setKeyMessages] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [isAdvertisement, setIsAdvertisement] = useState(true);
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Visual generation fields
  const [generateVisuals, setGenerateVisuals] = useState(false);
  const [visualStyle, setVisualStyle] = useState("modern");
  const [colorScheme, setColorScheme] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      // Reset form
      setContent("");
      setSelectedPlatforms(["Instagram", "Facebook"]);
      setScheduleOption("now");
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
      const response = await apiRequest("POST", "/api/ai/generate", params);
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.content);
      if (data.imageUrl) {
        setImagePrompt(data.imagePrompt || "");
      }
      toast({
        title: "Content Generated",
        description: "AI has created optimized content for your platforms",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    },
  });

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

    const status = scheduleOption === "approval" ? "pending" : 
                  scheduleOption === "later" ? "scheduled" : "published";

    createPostMutation.mutate({
      content,
      platforms: selectedPlatforms,
      status,
      aiGenerated: true,
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
      generateImage: generateVisuals,
      visualStyle,
      colorScheme,
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setContent(suggestion);
    setShowAiSuggestions(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Create Content</h1>
          <p className="text-muted-foreground mt-2">
            Generate AI-powered content optimized for your business and target audience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Input Fields - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandTone">Brand Tone</Label>
                    <Select value={brandTone} onValueChange={setBrandTone}>
                      <SelectTrigger className="mt-1">
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
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAdvertisement"
                      checked={isAdvertisement}
                      onCheckedChange={setIsAdvertisement}
                    />
                    <Label htmlFor="isAdvertisement" className="cursor-pointer">
                      Structure as Advertisement
                    </Label>
                  </div>
                  <Badge variant={isAdvertisement ? "default" : "secondary"}>
                    {isAdvertisement ? "Ad Format" : "Organic Content"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Visual Preferences
                </CardTitle>
                <CardDescription>
                  Define the visual style for AI-generated images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="generateVisuals"
                    checked={generateVisuals}
                    onCheckedChange={setGenerateVisuals}
                  />
                  <Label htmlFor="generateVisuals" className="cursor-pointer">
                    Generate AI Images with Content
                  </Label>
                </div>

                {generateVisuals && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <div>
                      <Label htmlFor="imagePrompt">Additional Image Instructions</Label>
                      <Textarea
                        id="imagePrompt"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe specific visual elements you want in the image..."
                        className="mt-1 h-20"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Content Editor
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
                  />
                </div>

                <div className="flex justify-between items-center mb-2">
                  <Label>Generated Content</Label>
                  <Button
                    onClick={handleAiGenerate}
                    disabled={generateAiContentMutation.isPending}
                    size="sm"
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
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Target Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformSelector 
                  selectedPlatforms={selectedPlatforms}
                  onPlatformsChange={setSelectedPlatforms}
                />
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {showAiSuggestions && (
              <Card>
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

            {/* Platform Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={selectedPlatforms[0] || "Instagram"}>
                  <TabsList className="grid w-full grid-cols-2">
                    {selectedPlatforms.slice(0, 2).map((platform) => (
                      <TabsTrigger key={platform} value={platform}>
                        {platform}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedPlatforms.map((platform) => (
                    <TabsContent key={platform} value={platform}>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">
                          {platform} Preview
                        </div>
                        <div className="bg-background p-3 rounded">
                          {content || `Your ${platform} optimized content will appear here...`}
                        </div>
                        {platform === "Twitter" && content.length > 280 && (
                          <Badge variant="destructive" className="mt-2">
                            {content.length}/280 characters
                          </Badge>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Schedule Options */}
            <Card>
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
                    <RadioGroupItem value="now" id="now" />
                    <Label htmlFor="now">Publish Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="later" id="later" />
                    <Label htmlFor="later">Schedule for Later</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approval" id="approval" />
                    <Label htmlFor="approval">Send for Approval</Label>
                  </div>
                </RadioGroup>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={createPostMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {createPostMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}