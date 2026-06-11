import type { SVGProps } from "react";
import type { ToolbarIconName } from "./types";

type ToolbarIconProps = SVGProps<SVGSVGElement> & {
  name: ToolbarIconName;
};

export function ToolbarIcon({ name, ...props }: ToolbarIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    >
      {name === "arrow" && <path d="M6 4l10.2 15 1.2-6.1 4.6-3.4L6 4z" />}
      {name === "hand" && (
        <path d="M7.5 12.5V6.8a1.3 1.3 0 0 1 2.6 0v5.1m0-4.1a1.3 1.3 0 0 1 2.6 0v4.1m0-3.3a1.3 1.3 0 0 1 2.6 0v4m0-2.8a1.3 1.3 0 0 1 2.6 0V14c0 4.2-2.4 6.5-6.2 6.5h-.6a5.4 5.4 0 0 1-4.4-2.3l-2-3a1.35 1.35 0 0 1 2.1-1.7l2.2 2.4" />
      )}
      {name === "upload" && (
        <>
          <path d="M12 15V4.5" />
          <path d="M8 8.5l4-4 4 4" />
          <path d="M5.5 19.5h13" />
        </>
      )}
      {name === "mic" && (
        <>
          <path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v4.5a2.5 2.5 0 0 1-5 0V7a2.5 2.5 0 0 1 2.5-2.5z" />
          <path d="M7.5 10.5a4.5 4.5 0 1 0 9 0" />
          <path d="M12 15v3.5" />
          <path d="M9.2 19.5h5.6" />
        </>
      )}
      {name === "text" && (
        <>
          <path d="M6 5.5h12" />
          <path d="M12 5.5v13" />
          <path d="M9.5 18.5h5" />
        </>
      )}
      {name === "frame" && (
        <>
          <path d="M5.5 5.5h13v13h-13z" />
          <path d="M5.5 9h13" />
          <path d="M9 5.5v13" />
        </>
      )}
      {name === "square" && <path d="M6.5 6.5h11v11h-11z" />}
      {name === "circle" && <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />}
      {name === "line" && <path d="M6.5 17.5l11-11" />}
      {name === "sparkles" && (
        <>
          <path d="M11.5 4.5l1.2 3.7 3.8 1.3-3.8 1.3-1.2 3.7-1.2-3.7-3.8-1.3 3.8-1.3 1.2-3.7z" />
          <path d="M18.5 14.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
        </>
      )}
      {name === "plus" && (
        <>
          <path d="M12 6.5v11" />
          <path d="M6.5 12h11" />
        </>
      )}
      {name === "minus" && <path d="M6.5 12h11" />}
    </svg>
  );
}
