"use client";

import { useEffect, useRef, useState } from "react";
import { getPreviewGradient, parseWebsiteUrl } from "./utils";

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;

type WebsitePreviewFrameProps = {
  url: string;
  interactive?: boolean;
  className?: string;
};

export function WebsitePreviewFrame({
  url,
  interactive = false,
  className = "",
}: WebsitePreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const meta = parseWebsiteUrl(url);
  const scale = Math.max(
    size.width / PREVIEW_WIDTH,
    size.height / PREVIEW_HEIGHT
  );
  const offsetX = (size.width - PREVIEW_WIDTH * scale) / 2;
  const offsetY = (size.height - PREVIEW_HEIGHT * scale) / 2;

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(1, width),
        height: Math.max(1, height),
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-full w-full overflow-hidden",
        className,
      ].join(" ")}
      style={{ background: getPreviewGradient(meta.hostname) }}
    >
      <iframe
        className={[
          "absolute left-0 top-0 border-0 bg-white",
          interactive ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        height={PREVIEW_HEIGHT}
        referrerPolicy="no-referrer-when-downgrade"
        src={url}
        title={`Preview of ${meta.hostname}`}
        width={PREVIEW_WIDTH}
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
