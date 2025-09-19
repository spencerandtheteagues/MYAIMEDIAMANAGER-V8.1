import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import TwitterPreview from './TwitterPreview';
import FacebookPreview from './FacebookPreview';
import InstagramPreview from './InstagramPreview';
import LinkedInPreview from './LinkedInPreview';
import TikTokPreview from './TikTokPreview';
import type { Post } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface PlatformPreviewFactoryProps {
  post: Post;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
  onGenerateCaption?: () => void;
  editable?: boolean;
  showCaptionBox?: boolean;
}

export default function PlatformPreviewFactory({
  post,
  caption,
  onCaptionChange,
  onGenerateCaption,
  editable = true,
  showCaptionBox = true
}: PlatformPreviewFactoryProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    post.platforms.length > 0 ? post.platforms[0] : 'X (Twitter)'
  );
  const [generatedCaption, setGeneratedCaption] = useState<string>(caption || post.content);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Fetch user settings for personalization
  const { data: userSettings } = useQuery({
    queryKey: ['/api/user/settings'],
    queryFn: async () => {
      const response = await fetch('/api/user/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  const userName = userSettings?.businessName || userSettings?.fullName || 'Your Business';
  const userHandle = userSettings?.username || 'yourbusiness';
  const userAvatar = userSettings?.avatar || userSettings?.googleAvatar;
  const userTitle = userSettings?.businessDescription || 'Growing businesses through innovation';

  useEffect(() => {
    if (caption) {
      setGeneratedCaption(caption);
    }
  }, [caption]);

  const handleCaptionChange = (newCaption: string) => {
    setGeneratedCaption(newCaption);
    if (onCaptionChange) {
      onCaptionChange(newCaption);
    }
  };

  const handleGenerateCaption = async () => {
    if (onGenerateCaption) {
      setIsGeneratingCaption(true);
      await onGenerateCaption();
      setIsGeneratingCaption(false);
    }
  };

  const renderPreview = () => {
    const previewProps = {
      post,
      userName,
      userHandle,
      userAvatar,
      caption: generatedCaption,
      onCaptionChange: editable ? handleCaptionChange : undefined
    };

    switch (selectedPlatform) {
      case 'Instagram':
        return <InstagramPreview {...previewProps} />;
      case 'Facebook':
        return <FacebookPreview {...previewProps} />;
      case 'X (Twitter)':
        return <TwitterPreview {...previewProps} />;
      case 'LinkedIn':
        return <LinkedInPreview {...previewProps} userTitle={userTitle} />;
      case 'TikTok':
        return <TikTokPreview {...previewProps} />;
      default:
        return <TwitterPreview {...previewProps} />;
    }
  };

  // If only one platform, show it directly without tabs
  if (post.platforms.length === 1) {
    return (
      <div className="space-y-4">
        {showCaptionBox && (post.mediaUrls && post.mediaUrls.length > 0) && (
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                  AI-Generated Caption
                </h4>
              </div>
              {onGenerateCaption && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {editable ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleCaptionChange(e.currentTarget.textContent || '')}
                  className="outline-none focus:bg-white dark:focus:bg-gray-800 rounded px-2 py-1 -mx-2 -my-1 min-h-[60px]"
                  dangerouslySetInnerHTML={{ __html: generatedCaption }}
                />
              ) : (
                <p>{generatedCaption}</p>
              )}
            </div>
            {editable && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Click to edit caption directly
              </p>
            )}
          </Card>
        )}
        {renderPreview()}
      </div>
    );
  }

  // Multiple platforms - show with tabs
  return (
    <div className="space-y-4">
      {showCaptionBox && (post.mediaUrls && post.mediaUrls.length > 0) && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                AI-Generated Caption
              </h4>
            </div>
            {onGenerateCaption && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {editable ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCaptionChange(e.currentTarget.textContent || '')}
                className="outline-none focus:bg-white dark:focus:bg-gray-800 rounded px-2 py-1 -mx-2 -my-1 min-h-[60px]"
                dangerouslySetInnerHTML={{ __html: generatedCaption }}
              />
            ) : (
              <p>{generatedCaption}</p>
            )}
          </div>
          {editable && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Click to edit caption - changes apply to all platforms
            </p>
          )}
        </Card>
      )}

      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="grid grid-cols-auto gap-1" style={{ gridTemplateColumns: `repeat(${post.platforms.length}, minmax(0, 1fr))` }}>
          {post.platforms.map((platform) => (
            <TabsTrigger key={platform} value={platform} className="text-xs px-2">
              {platform.replace('X (Twitter)', 'X')}
            </TabsTrigger>
          ))}
        </TabsList>

        {post.platforms.map((platform) => (
          <TabsContent key={platform} value={platform} className="mt-4">
            <div className="transition-all duration-300 ease-in-out">
              {platform === selectedPlatform && renderPreview()}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}