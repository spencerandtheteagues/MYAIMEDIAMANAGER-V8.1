import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Post } from '@shared/schema';

interface TikTokPreviewProps {
  post: Post;
  userName?: string;
  userHandle?: string;
  userAvatar?: string;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
}

export default function TikTokPreview({
  post,
  userName = 'yourbusiness',
  userHandle = '@yourbusiness',
  userAvatar,
  caption,
  onCaptionChange
}: TikTokPreviewProps) {
  const displayCaption = caption || post.content;
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = hasMedia && post.mediaUrls![0].includes('video');

  // Generate realistic engagement
  const likes = Math.floor(Math.random() * 10000) + 1000;
  const comments = Math.floor(Math.random() * 500) + 50;
  const shares = Math.floor(Math.random() * 200) + 20;
  const saves = Math.floor(Math.random() * 300) + 30;

  // Format numbers for TikTok style (1.2K, 10.5K, etc)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-black rounded-lg max-w-[390px] mx-auto font-sans overflow-hidden relative">
      {/* Main Content Area */}
      <div className="relative" style={{ height: '844px' }}>
        {/* Video/Image Background */}
        {hasMedia ? (
          <div className="absolute inset-0 bg-gray-900">
            {isVideo ? (
              <video
                src={post.mediaUrls![0]}
                className="w-full h-full object-cover"
                controls={false}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={post.mediaUrls![0]}
                alt="TikTok post"
                className="w-full h-full object-cover"
              />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <div className="text-white text-center">
              <Music className="w-20 h-20 mx-auto mb-4 animate-pulse" />
              <p className="text-lg">Video Preview</p>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-4">
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-white">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold text-base">{userName}</span>
                <button className="bg-red-500 text-white px-4 py-1 rounded text-sm font-semibold">
                  Follow
                </button>
              </div>
            </div>
          </div>

          {/* Caption with editing */}
          <div className="mb-4">
            {onCaptionChange ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
                className="text-white text-sm leading-relaxed outline-none focus:bg-white/10 rounded px-1 -mx-1"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                dangerouslySetInnerHTML={{ __html: displayCaption }}
              />
            ) : (
              <p className="text-white text-sm leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {displayCaption}
              </p>
            )}
          </div>

          {/* Music/Sound Info */}
          <div className="flex items-center space-x-2 mb-4">
            <Music className="w-4 h-4 text-white" />
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="text-white text-xs whitespace-nowrap animate-marquee">
                Original Sound - {userName}
              </span>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="flex items-center justify-around py-2 border-t border-white/20">
            <button className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6 text-white fill-white" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span className="text-white text-[10px]">Home</span>
            </button>
            <button className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span className="text-white/60 text-[10px]">Discover</span>
            </button>
            <button className="relative">
              <div className="w-11 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="absolute -left-1 w-11 h-8 bg-cyan-400 rounded-lg" />
                <div className="absolute -right-1 w-11 h-8 bg-red-500 rounded-lg" />
                <div className="relative w-11 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
              </div>
            </button>
            <button className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span className="text-white/60 text-[10px]">Inbox</span>
            </button>
            <button className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span className="text-white/60 text-[10px]">Profile</span>
            </button>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-2 bottom-32 flex flex-col items-center space-y-6 z-10">
          {/* Like */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </button>
            <span className="text-white text-xs mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {formatNumber(likes)}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </button>
            <span className="text-white text-xs mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {formatNumber(comments)}
            </span>
          </div>

          {/* Save */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Bookmark className="w-7 h-7 text-white" />
            </button>
            <span className="text-white text-xs mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {formatNumber(saves)}
            </span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Share2 className="w-7 h-7 text-white" />
            </button>
            <span className="text-white text-xs mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {formatNumber(shares)}
            </span>
          </div>

          {/* Music Album */}
          <button className="w-12 h-12 rounded-full overflow-hidden border-2 border-white animate-spin-slow">
            {userAvatar ? (
              <img src={userAvatar} alt="Sound" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}