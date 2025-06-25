import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Post {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  user: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
}

interface Comment {
  id: number;
  content: string;
  author: string;
  avatar?: string;
  timestamp: string;
}

interface PostComponentProps {
  post: Post;
  currentUser: any;
  likedPosts: Set<number>;
  showComments: Set<number>;
  postComments: Record<number, Comment[]>;
  postCommentsCount: Record<number, number>;
  commentInputs: Record<number, string>;
  onLike: (postId: number) => void;
  onToggleComments: (postId: number) => void;
  onUpdateCommentInput: (postId: number, value: string) => void;
  onAddComment: (postId: number) => void;
  onUserClick?: (username: string) => void;
}

export function PostComponent({
  post,
  currentUser,
  likedPosts,
  showComments,
  postComments,
  postCommentsCount,
  commentInputs,
  onLike,
  onToggleComments,
  onUpdateCommentInput,
  onAddComment,
  onUserClick
}: PostComponentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUserClick = (username: string) => {
    if (onUserClick) {
      onUserClick(username);
    }
  };

  return (
    <div className="bg-[hsl(222,84%,5%)] rounded-lg p-6 border border-[hsl(214,35%,30%)]">
      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {post.user.avatar ? (
            <img 
              src={post.user.avatar} 
              alt={`Avatar de ${post.user.name}`} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {post.user.name?.charAt(0)?.toUpperCase() || post.user.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleUserClick(post.user.username)}
              className="font-semibold text-white hover:text-[#F37261] transition-colors cursor-pointer"
            >
              {post.user.name}
            </button>
            <button 
              onClick={() => handleUserClick(post.user.username)}
              className="text-gray-400 hover:text-[#F37261] transition-colors cursor-pointer"
            >
              @{post.user.username}
            </button>
          </div>
          <p className="text-gray-300 text-sm">
            {new Date(post.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>

      {/* Post Actions - Only show counts for "mes posts" */}
      <div className="flex items-center justify-between pt-4 border-t border-[hsl(214,35%,30%)]">
        <div className="flex items-center space-x-6">
          {/* Like Count Only */}
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{post.likesCount || 0} j'aime</span>
          </div>

          {/* Comment Count Only */}
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{postCommentsCount[post.id] || 0} commentaires</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments.has(post.id) && (
        <div className="mt-4 pt-4 border-t border-[hsl(214,35%,30%)]">
          {/* Add Comment Input */}
          <div className="flex space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentUser?.user?.avatar ? (
                <img 
                  src={currentUser.user.avatar} 
                  alt={`Avatar de ${currentUser.user.name || currentUser.user.username}`} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {currentUser?.user?.name?.charAt(0)?.toUpperCase() || currentUser?.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 flex space-x-2">
              <Input
                placeholder="Écrire un commentaire..."
                value={commentInputs[post.id] || ''}
                onChange={(e) => onUpdateCommentInput(post.id, e.target.value)}
                className="flex-1 bg-[hsl(214,35%,20%)] border-[hsl(214,35%,30%)] text-white placeholder-gray-400"
              />
              <Button
                onClick={() => onAddComment(post.id)}
                disabled={!commentInputs[post.id]?.trim()}
                size="sm"
                className="bg-[#F37261] hover:bg-[#e5634f] text-white"
              >
                Publier
              </Button>
            </div>
          </div>

          {/* Comments List - Only show if comments are loaded */}
          {postComments[post.id] && postComments[post.id].length > 0 && (
            <div className="space-y-3 mb-4">
              {postComments[post.id].map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {comment.avatar ? (
                      <img 
                        src={comment.avatar} 
                        alt={`Avatar de ${comment.author}`} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white text-sm">{comment.author}</span>
                      <span className="text-gray-400 text-xs">{comment.timestamp}</span>
                    </div>
                    <p className="text-gray-200 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}