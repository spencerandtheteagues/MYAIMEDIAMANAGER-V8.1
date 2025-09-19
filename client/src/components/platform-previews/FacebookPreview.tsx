import React from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@shared/schema';

interface FacebookPreviewProps {
  post: Post;
  userName?: string;
  userAvatar?: string;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
}

export default function FacebookPreview({
  post,
  userName = 'Your Business',
  userAvatar,
  caption,
  onCaptionChange
}: FacebookPreviewProps) {
  const displayCaption = caption || post.content;
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = hasMedia && post.mediaUrls![0].includes('video');

  // Generate realistic engagement numbers
  const likes = Math.floor(Math.random() * 150) + 20;
  const comments = Math.floor(Math.random() * 30) + 5;
  const shares = Math.floor(Math.random() * 15) + 2;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-[500px] mx-auto font-sans shadow-sm">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Profile Picture */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                  {userName}
                </h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {post.scheduledFor
                      ? formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })
                      : 'Just now'}
                  </span>
                  <span>·</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
              <button className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Post Text with Caption Editing */}
        <div className="mt-3">
          {onCaptionChange ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
              className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words outline-none focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1 -mx-1"
              dangerouslySetInnerHTML={{ __html: displayCaption }}
            />
          ) : (
            <p className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {displayCaption}
            </p>
          )}
        </div>
      </div>

      {/* Media Attachment */}
      {hasMedia && (
        <div className="relative">
          {isVideo ? (
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                src={post.mediaUrls![0]}
                className="w-full h-full object-cover"
                controls
                muted
              />
              {/* Video Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-gray-800 border-b-[10px] border-b-transparent ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={post.mediaUrls![0]}
              alt="Post media"
              className="w-full object-cover"
              style={{ maxHeight: '600px' }}
            />
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-3 h-3 text-white fill-white" />
              </div>
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white fill-white" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </div>
            </div>
            <span>{likes}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span>{comments} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1">
        <div className="flex items-center justify-around">
          <button className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}