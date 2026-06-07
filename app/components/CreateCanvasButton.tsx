"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

export function CreateCanvasButton({
  createCanvasAction,
}: {
  createCanvasAction: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await createCanvasAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="cursor-pointer w-full h-8 rounded-md text-sm font-thin capitalize lime text-black flex items-center p-2 gap-2 hover:bg-lime-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          please wait...
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          Create new file
        </>
      )}
    </button>
  );
}
