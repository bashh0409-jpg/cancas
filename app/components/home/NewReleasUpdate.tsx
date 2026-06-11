"use client";

import { X } from "lucide-react";
import React, { useState } from "react";

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
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              loop
              controls
              preload="auto"
            >
              <source
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <button
            onClick={close}
            className="mt-6 h-8 cursor-pointer rounded bg-black px-2 text-xs font-medium uppercase text-white"
          >
            Explore what&apos;s new
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewReleaseUpdate;
