import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Card } from '@shared/schema';

interface ChunkedCardsResponse {
  cards: Card[];
  totalCards: number;
  currentChunk: number;
  totalChunks: number;
  hasMore: boolean;
}

export function useChunkedCards(collectionId: number) {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Query for the current chunk
  const { data: chunkData, isLoading: isChunkLoading, error } = useQuery<ChunkedCardsResponse>({
    queryKey: [`/api/collections/${collectionId}/cards`, { chunk: currentChunk }],
    queryFn: async () => {
      const response = await fetch(`/api/collections/${collectionId}/cards?chunk=${currentChunk}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: collectionId > 0,
    staleTime: 0,
    retry: 3,
  });

  // Load all chunks progressively
  useEffect(() => {
    if (chunkData && !isLoadingAll) {
      setIsLoadingAll(true);
      setAllCards(chunkData.cards);
      
      // Calculate progress
      const progress = Math.round(((currentChunk + 1) / chunkData.totalChunks) * 100);
      setLoadingProgress(progress);
      
      // If there are more chunks, load the next one
      if (chunkData.hasMore) {
        const timer = setTimeout(() => {
          setCurrentChunk(prev => prev + 1);
        }, 100); // Small delay to prevent overwhelming the server
        
        return () => clearTimeout(timer);
      } else {
        setIsLoadingAll(false);
      }
    }
  }, [chunkData, isLoadingAll]);

  // Append new chunk data to existing cards
  useEffect(() => {
    if (chunkData && currentChunk > 0) {
      setAllCards(prev => [...prev, ...chunkData.cards]);
    }
  }, [chunkData, currentChunk]);

  const isLoading = isChunkLoading || isLoadingAll;
  const totalCards = chunkData?.totalCards || 0;
  const loadedCards = allCards?.length || 0;

  return {
    cards: allCards || [],
    isLoading,
    error,
    totalCards,
    loadedCards,
    loadingProgress,
    isComplete: !isLoading && totalCards > 0 && loadedCards === totalCards
  };
}