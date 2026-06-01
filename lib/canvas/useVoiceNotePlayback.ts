"use client";

import { useCallback, useRef, useState } from "react";

export function useVoiceNotePlayback() {
  const [playingNodeId, setPlayingNodeId] = useState<string | null>(null);
  const [playbackMsByNodeId, setPlaybackMsByNodeId] = useState<
    Record<string, number>
  >({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});

  const registerAudioElement = useCallback(
    (nodeId: string, element: HTMLAudioElement | null) => {
      audioElementsRef.current[nodeId] = element;
    },
    []
  );

  const togglePlayback = useCallback((nodeId: string) => {
    const targetAudio = audioElementsRef.current[nodeId];

    if (!targetAudio) {
      return;
    }

    if (playingNodeId === nodeId) {
      targetAudio.pause();
      setPlayingNodeId(null);
      return;
    }

    Object.entries(audioElementsRef.current).forEach(([id, audio]) => {
      if (!audio || id === nodeId) {
        return;
      }

      audio.pause();
    });

    void targetAudio.play();
    setPlayingNodeId(nodeId);
  }, [playingNodeId]);

  const removeNodePlayback = useCallback((nodeId: string) => {
    const audio = audioElementsRef.current[nodeId];

    if (audio) {
      audio.pause();
    }

    delete audioElementsRef.current[nodeId];
    setPlaybackMsByNodeId((current) => {
      const next = { ...current };
      delete next[nodeId];
      return next;
    });
    setPlayingNodeId((current) => (current === nodeId ? null : current));
  }, []);

  const handleAudioEnded = useCallback((nodeId: string) => {
    setPlayingNodeId((current) => (current === nodeId ? null : current));
  }, []);

  const handleAudioPaused = useCallback((nodeId: string) => {
    setPlayingNodeId((current) => (current === nodeId ? null : current));
  }, []);

  const handleAudioPlaying = useCallback((nodeId: string) => {
    setPlayingNodeId(nodeId);
  }, []);

  const handleAudioTimeUpdate = useCallback((nodeId: string, playbackMs: number) => {
    setPlaybackMsByNodeId((current) => ({
      ...current,
      [nodeId]: playbackMs,
    }));
  }, []);

  const cleanupAllAudio = useCallback(() => {
    Object.values(audioElementsRef.current).forEach((audio) => {
      audio?.pause();
    });
  }, []);

  return {
    playingNodeId,
    playbackMsByNodeId,
    registerAudioElement,
    togglePlayback,
    removeNodePlayback,
    handleAudioEnded,
    handleAudioPaused,
    handleAudioPlaying,
    handleAudioTimeUpdate,
    cleanupAllAudio,
  };
}
