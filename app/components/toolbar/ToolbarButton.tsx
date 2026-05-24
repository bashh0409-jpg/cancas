import type { ButtonHTMLAttributes } from "react";
import { ToolbarIcon } from "./ToolbarIcon";
import type { ToolbarIconName } from "./types";

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ToolbarIconName;
  label: string;
  active?: boolean;
};

export function ToolbarButton({
  active = false,
  className = "",
  icon,
  label,
  type = "button",
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      type={type}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-full text-zinc-800 transition",
        active ? "bg-[#0d99ff] text-white" : "hover:bg-zinc-100",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      ].join(" ")}
      {...props}
    >
      <ToolbarIcon name={icon} />
    </button>
  );
}
