"use client";

import { X } from "lucide-react";
import React, { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import type { MuxCSSProperties } from "@mux/mux-player-react";

type Props = {
  userId: string | null;
};

const UPDATE_VERSION = "v1";

const getStorageKey = (userId: string) =>
  `new-release-update:${UPDATE_VERSION}:${userId}`;

const NewReleaseUpdate = ({ userId }: Props) => {
  const [open, setOpen] = useState(() => {
    if (!userId || typeof window === "undefined") return false;

    const key = getStorageKey(userId);
    return localStorage.getItem(key) !== "true";
  });

  const close = () => {
    if (userId && typeof window !== "undefined") {
      const key = getStorageKey(userId);
      localStorage.setItem(key, "true");
    }
    setOpen(false);
  };

  if (!open) return null;

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
