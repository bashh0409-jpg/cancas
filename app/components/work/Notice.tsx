"use client";

import { X } from "lucide-react";
import React from "react";
import { activeNotices, type NoticeConfig } from "@/lib/notices";

const DISMISSED_KEY = "notices-dismissed";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  try {
    const current = getDismissed();
    if (!current.includes(id)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
    }
  } catch {
    // localStorage unavailable
  }
}

type NoticeBarProps = {
  notice: NoticeConfig;
  onDismiss: (id: string) => void;
};

const NoticeBar = ({ notice, onDismiss }: NoticeBarProps) => {
  return (
    <div className="w-full px-4 py-0.5 font-medium text-[10px] md:text-xs lime2 text-black tracking-tight mono uppercase flex items-center justify-between">
      {notice.badge && (
        <span className="bg-black mr-2 text-white rounded-full px-1 ">
          {notice.badge}
        </span>
      )}
      <span>
        {notice.message}
        {notice.link && (
          <a
            href={notice.link.href}
            className="ml-1 cursor-pointer underline"
          >
            {notice.link.text}
          </a>
        )}
      </span>
      <button
        onClick={() => onDismiss(notice.id)}
        className="cursor-pointer"
      >
        <X className="w-6 h-6 stroke-[1.5]" />
      </button>
    </div>
  );
};

const Notice = () => {
  const [visibleNotices, setVisibleNotices] = React.useState<NoticeConfig[]>(
    activeNotices,
  );

  React.useEffect(() => {
    const dismissed = getDismissed();
    setVisibleNotices(activeNotices.filter((n) => !dismissed.includes(n.id)));
  }, []);

  const handleDismiss = (id: string) => {
    dismiss(id);
    setVisibleNotices((prev) => prev.filter((n) => n.id !== id));
  };

  if (visibleNotices.length === 0) return null;

  return (
    <div>
      {visibleNotices.map((notice) => (
        <NoticeBar
          key={notice.id}
          notice={notice}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default Notice;