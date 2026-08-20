"use client";

import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";
import type { MuxCSSProperties } from "@mux/mux-player-react";

type Props = {
  userId: string | null;
};

const UPDATE_VERSION = "v1";

const getStorageKey = (userId: string) =>
  `new-release-update:${UPDATE_VERSION}:${userId}`;

const NewReleaseUpdate = ({ userId }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = getStorageKey(userId);
    setOpen(localStorage.getItem(key) !== "true");
    setMounted(true);
  }, [userId]);

  const close = () => {
    if (userId) {
      const key = getStorageKey(userId);
      localStorage.setItem(key, "true");
    }
    setOpen(false);
  };

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="relative flex aspect-square w-full max-w-2xl flex-col rounded bg-white p-6">
        <button
          onClick={close}
          className="absolute right-4 top-4 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="max-w-md text-2xl tracking-tight">
            What&apos;s new, built to streamline work
          </h1>

          <div className="mt-6 w-full flex-1 overflow-hidden rounded bg-neutral-100">
            <MuxPlayer
              src="https://player.mux.com/velHpMwVI0000UWC2mG1UTfmcS7G901H8kgIyJqJB79bjo?metadata-video-title=107&video-title=107"
              poster="https://image.mux.com/velHpMwVI0000UWC2mG1UTfmcS7G901H8kgIyJqJB79bjo/animated.gif"
              metadata={{ video_title: "What's new in Canvas" }}
              autoPlay
              muted
              loop
              className="h-full mux w-full"
              style={
                {
                  width: "100%",
                  height: "100%",
                  minHeight: 0,
                  minWidth: 0,
                  objectFit: "cover",
                  "--media-object-fit": "cover",
                  "--controls": "none",
                  "--media-control-display": "none",
                } as MuxCSSProperties
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReleaseUpdate;
