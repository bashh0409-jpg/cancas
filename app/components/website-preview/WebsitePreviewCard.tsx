"use client";

import { WebsitePreviewFrame } from "./WebsitePreviewFrame";

type WebsitePreviewCardProps = {
  url: string;
};

export function WebsitePreviewCard({ url }: WebsitePreviewCardProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-black/[0.06] shadow-[0_10px_40px_rgba(24,20,12,0.14)]">
      <WebsitePreviewFrame url={url} />
    </div>
  );
}
