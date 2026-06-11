"use client";

import { ToolbarButton } from "./ToolbarButton";

type TextToolButtonProps = {
  isActive?: boolean;
  onActivate: () => void;
};

export function TextToolButton({
  isActive = false,
  onActivate,
}: TextToolButtonProps) {
  return (
    <ToolbarButton
      icon="text"
      label="Text"
      active={isActive}
      onClick={onActivate}
    />
  );
}
