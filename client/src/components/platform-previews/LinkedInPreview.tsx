import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Send, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@shared/schema';

interface LinkedInPreviewProps {
  post: Post;
  userName?: string;
  userTitle?: string;
  userAvatar?: string;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
}

export default function LinkedInPreview({
  post,
  userName = 'Your Business',
  userTitle = 'Growing businesses through innovation',
  userAvatar,
  caption,
  onCaptionChange
}: LinkedInPreviewProps) {
  const displayCaption = caption || post.content;
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = hasMedia && post.mediaUrls![0].includes('video');

  // Generate realistic engagement
  const reactions = Math.floor(Math.random() * 200) + 30;
  const comments = Math.floor(Math.random() * 40) + 5;
  const reposts = Math.floor(Math.random() * 20) + 2;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-[552px] mx-auto font-sans shadow-sm">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Profile Picture */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-blue-700 text-white">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[14px] text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
                  {userName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {userTitle}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>
                    {post.scheduledFor
                      ? formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })
                      : 'Just now'}
                  </span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
              <button className="ml-auto text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-4 py-1 rounded-full border border-blue-600 font-semibold text-sm">
                + Follow
              </button>
            </div>
          </div>
        </div>

        {/* Post Text with Caption Editing */}
        <div className="mt-4">
          {onCaptionChange ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
              className="text-[14px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words outline-none focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1 -mx-1 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: displayCaption }}
            />
          ) : (
            <p className="text-[14px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {displayCaption}
            </p>
          )}

          {/* Hashtags */}
          {displayCaption.includes('#') && (
            <div className="mt-2 flex flex-wrap gap-1">
              {displayCaption.match(/#\w+/g)?.map((tag, index) => (
                <span key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
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
            </div>
          ) : (
            <img
              src={post.mediaUrls![0]}
              alt="Post media"
              className="w-full object-cover"
              style={{ maxHeight: '400px' }}
            />
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
              </svg>
            </div>
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white fill-white" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
          </div>
          <span>{reactions}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>{comments} comments</span>
          <span>•</span>
          <span>{reposts} reposts</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-1">
        <div className="flex items-center justify-around">
          <button className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Repost</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <Send className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}