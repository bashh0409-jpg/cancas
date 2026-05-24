import type { ReactNode } from "react";

type ToolGroupProps = {
  children: ReactNode;
};

export function ToolGroup({ children }: ToolGroupProps) {
  return <div className="flex items-center gap-0.5 px-0.5">{children}</div>;
}
