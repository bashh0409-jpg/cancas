"use client";

import { useRef } from "react";
import { ToolbarButton } from "./ToolbarButton";

export function AddFileButton() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <ToolbarButton
        icon="upload"
        label="Add file"
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        className="hidden"
        multiple
        type="file"
        onChange={(event) => {
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}
