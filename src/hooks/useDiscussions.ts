/**
 * React hooks for discussion and comment operations
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type {
  ApiResponse,
  DiscussionData,
  CommentData,
  DiscussionCommentsResponse,
  PostCommentRequest,
  DiscussionQuery,
  DiscussionCommentsFilters,
} from '../types';
import type { IndexerClient } from '../network/IndexerClient';
import { useAuthStore } from '../stores/auth-store';

const STALE_TIME = 60 * 1000; // 1 minute

/**
 * Fetch discussion metadata for a subject.
 * Returns null if no discussion exists yet.
 */
export function useDiscussion(
  client: IndexerClient,
  query: DiscussionQuery,
  options?: Omit<UseQueryOptions<ApiResponse<DiscussionData | null>>, 'queryKey' | 'queryFn'>
) {
  const enabled = Boolean(query.subjectType && query.sport && query.subjectId);

  const result = useQuery({
    queryKey: ['heavymath', 'discussion', query.subjectType, query.sport, query.subjectId],
    queryFn: () => client.getDiscussion(query),
    staleTime: STALE_TIME,
    enabled,
    ...options,
  });

  return {
    discussion: result.data?.data ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Fetch paginated, threaded comments for a discussion.
 */
export function useDiscussionComments(
  client: IndexerClient,
  discussionId: number | null | undefined,
  filters?: DiscussionCommentsFilters,
  options?: Omit<UseQueryOptions<ApiResponse<DiscussionCommentsResponse>>, 'queryKey' | 'queryFn'>
) {
  const result = useQuery({
    queryKey: ['heavymath', 'discussionComments', discussionId, filters],
    queryFn: () => client.getDiscussionComments(discussionId!, filters),
    staleTime: STALE_TIME,
    enabled: discussionId != null,
    ...options,
  });

  return {
    data: result.data?.data ?? null,
    comments: result.data?.data?.comments ?? [],
    pagination: result.data?.data?.pagination ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Mutation hook for posting a comment.
 * Invalidates discussion and comments queries on success.
 */
export function usePostComment(client: IndexerClient) {
  const queryClient = useQueryClient();
  const { getToken } = useAuthStore();

  return useMutation({
    mutationFn: async (body: PostCommentRequest): Promise<ApiResponse<CommentData>> => {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in with your wallet.');
      }
      return await client.postComment(token, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'heavymath',
          'discussion',
          variables.subjectType,
          variables.sport,
          variables.subjectId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['heavymath', 'discussionComments'],
      });
    },
  });
}

/**
 * Mutation hook for deleting a comment.
 * Invalidates discussion and comments queries on success.
 */
export function useDeleteComment(client: IndexerClient) {
  const queryClient = useQueryClient();
  const { getToken } = useAuthStore();

  return useMutation({
    mutationFn: async (commentId: number): Promise<ApiResponse<{ message: string }>> => {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in with your wallet.');
      }
      return await client.deleteComment(token, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['heavymath', 'discussion'],
      });
      queryClient.invalidateQueries({
        queryKey: ['heavymath', 'discussionComments'],
      });
    },
  });
}
