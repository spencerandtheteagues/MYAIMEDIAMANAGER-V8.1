import React from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Bookmark, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@shared/schema';

interface TwitterPreviewProps {
  post: Post;
  userName?: string;
  userHandle?: string;
  userAvatar?: string;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
}

export default function TwitterPreview({
  post,
  userName = 'Your Business',
  userHandle = 'yourbusiness',
  userAvatar,
  caption,
  onCaptionChange
}: TwitterPreviewProps) {
  const displayCaption = caption || post.content;
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = hasMedia && post.mediaUrls![0].includes('video');

  // Generate realistic engagement numbers based on content length
  const likes = Math.floor(Math.random() * 50) + 5;
  const retweets = Math.floor(Math.random() * 20) + 2;
  const replies = Math.floor(Math.random() * 15) + 1;
  const views = Math.floor(Math.random() * 500) + 100;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl max-w-[598px] mx-auto font-sans">
      {/* Tweet Content */}
      <div className="p-3">
        <div className="flex space-x-3">
          {/* Profile Picture */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-blue-500 text-white">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Tweet Body */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-[15px] text-gray-900 dark:text-white">
                  {userName}
                </span>
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                </svg>
                <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                  @{userHandle}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-[15px]">·</span>
                <span className="text-gray-500 dark:text-gray-400 text-[15px] hover:underline cursor-pointer">
                  {post.scheduledFor
                    ? formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: false })
                    : 'now'}
                </span>
              </div>
              <button className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full p-1.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Tweet Text with Caption Editing */}
            <div className="mt-1">
              {onCaptionChange ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
                  className="text-[15px] text-gray-900 dark:text-white whitespace-pre-wrap break-words outline-none focus:bg-gray-50 dark:focus:bg-gray-900 rounded px-1 -mx-1"
                  dangerouslySetInnerHTML={{ __html: displayCaption }}
                />
              ) : (
                <p className="text-[15px] text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                  {displayCaption}
                </p>
              )}
            </div>

            {/* Media Attachment */}
            {hasMedia && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {isVideo ? (
                  <div className="relative bg-black aspect-video flex items-center justify-center">
                    <video
                      src={post.mediaUrls![0]}
                      className="w-full h-full object-contain"
                      controls
                      muted
                    />
                    {/* Video Duration Overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      0:15
                    </div>
                  </div>
                ) : (
                  <img
                    src={post.mediaUrls![0]}
                    alt="Tweet media"
                    className="w-full object-cover"
                    style={{ maxHeight: '510px' }}
                  />
                )}
              </div>
            )}

            {/* Engagement Actions */}
            <div className="flex items-center justify-between mt-3 -ml-2">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group">
                <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] group-hover:text-blue-500">{replies}</span>
              </button>

              <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 group">
                <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-950">
                  <Repeat2 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] group-hover:text-green-500">{retweets}</span>
              </button>

              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 group">
                <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-950">
                  <Heart className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] group-hover:text-red-500">{likes}</span>
              </button>

              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group">
                <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950">
                  <BarChart3 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] group-hover:text-blue-500">{views}</span>
              </button>

              <div className="flex items-center space-x-1">
                <button className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950">
                  <Bookmark className="w-[18px] h-[18px]" />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950">
                  <Share className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}