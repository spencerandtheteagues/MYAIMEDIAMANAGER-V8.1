import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@shared/schema';

interface InstagramPreviewProps {
  post: Post;
  userName?: string;
  userHandle?: string;
  userAvatar?: string;
  caption?: string;
  onCaptionChange?: (newCaption: string) => void;
}

export default function InstagramPreview({
  post,
  userName = 'yourbusiness',
  userHandle = 'yourbusiness',
  userAvatar,
  caption,
  onCaptionChange
}: InstagramPreviewProps) {
  const displayCaption = caption || post.content;
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = hasMedia && post.mediaUrls![0].includes('video');

  // Generate realistic engagement
  const likes = Math.floor(Math.random() * 500) + 50;
  const timeAgo = post.scheduledFor
    ? formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })
    : 'Just now';

  // Extract hashtags from caption
  const hashtagRegex = /#\w+/g;
  const hashtags = displayCaption.match(hashtagRegex) || [];
  const captionWithoutHashtags = displayCaption.replace(hashtagRegex, '').trim();

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg max-w-[468px] mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8 ring-2 ring-pink-500 ring-offset-2">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {userHandle}
            </span>
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          </div>
        </div>
        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media */}
      {hasMedia ? (
        <div className="relative bg-gray-100 dark:bg-gray-900 aspect-square">
          {isVideo ? (
            <div className="relative w-full h-full">
              <video
                src={post.mediaUrls![0]}
                className="w-full h-full object-cover"
                controls={false}
                muted
                loop
                autoPlay
              />
              {/* Video indicator */}
              <div className="absolute top-3 right-3">
                <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            </div>
          ) : (
            <img
              src={post.mediaUrls![0]}
              alt="Instagram post"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-900 aspect-square flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No image available</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button className="hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            <button className="hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            <button className="hover:scale-110 transition-transform">
              <Send className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
          <button className="hover:scale-110 transition-transform">
            <Bookmark className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Likes */}
        <div className="mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {likes.toLocaleString()} likes
          </span>
        </div>

        {/* Caption with editing */}
        <div className="mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
            {userHandle}
          </span>
          {onCaptionChange ? (
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
              className="text-sm text-gray-900 dark:text-white outline-none focus:bg-gray-50 dark:focus:bg-gray-900 rounded px-1 -mx-1"
              dangerouslySetInnerHTML={{ __html: captionWithoutHashtags }}
            />
          ) : (
            <span className="text-sm text-gray-900 dark:text-white">
              {captionWithoutHashtags}
            </span>
          )}
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="mb-2">
            {hashtags.map((tag, index) => (
              <span key={index} className="text-sm text-blue-500 mr-2 cursor-pointer hover:underline">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View all comments */}
        <button className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          View all comments
        </button>

        {/* Time */}
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
          {timeAgo}
        </div>
      </div>

      {/* Add Comment Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex items-center space-x-3">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
          disabled
        />
        <button className="text-blue-500 font-semibold text-sm opacity-50">
          Post
        </button>
      </div>
    </div>
  );
}