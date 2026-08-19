"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, ImageIcon, ArrowLeft } from "lucide-react";

type UnsplashImage = {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
  width: number;
  height: number;
};

type UnsplashSearchModalProps = {
  onClose: () => void;
  onSelectImage: (image: UnsplashImage) => void;
};

export function UnsplashSearchModal({
  onClose,
  onSelectImage,
}: UnsplashSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const performSearch = useCallback(
    async (searchQuery: string, pageNum: number) => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/unsplash/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&per_page=20`,
        );

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to search");
        }

        const data = (await response.json()) as {
          results: UnsplashImage[];
          total: number;
          totalPages: number;
        };

        if (pageNum === 1) {
          setResults(data.results);
        } else {
          setResults((prev) => [...prev, ...data.results]);
        }
        setTotalPages(data.totalPages);
        setHasSearched(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search Unsplash",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        setPage(1);
        performSearch(value, 1);
      }
    }, 400);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(query, nextPage);
  };

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop */}
      <div className="flex- ml-12 bg-black/40" onClick={onClose} />

      {/* Sidebar panel — matches ConnectPanel style */}
      <div className="w-60 h-screen bg-[#212126] border-l border-white/10 p-4 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 ">
          <h3 className="text-white flex items-center gap-2 text-xs mono uppercase tracking-tight">
            <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.25} />
            Stock Photos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 cursor-pointer hover:text-white transition"
          >
            <X className="w-4 h-4" strokeWidth={1.25} />
          </button>
        </div>

        {/* Search input */}
        <div className="mb-3">
          
          <div className=" w-full gap-2 px-1 flex bg-white/10 items-center rounded-xs border border-white/20  text-white">
            <Search className="w-5 h-5" strokeWidth={1.5} />{" "}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search photos..."
              className=" w-full   h-full py-1 text-xs uppercase text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-none focus:ring-0 focus:ring-white/0"
            />{" "}
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-white/40" />
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 mono uppercase tracking-tight rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!hasSearched && !isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-2">
            <ImageIcon className="mb-3 h-8 w-8 text-white/20" strokeWidth={1} />
            <p className="text-[10px] mono uppercase tracking-tight text-white/40">
              Search millions of free stock photos
            </p>
          </div>
        )}

        {hasSearched && results.length === 0 && !isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[10px] text-white/40">No results found.</p>
          </div>
        )}

        {/* Results grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="grid grid-cols-2 gap-1">
            {results.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onSelectImage(image)}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-xs border border-white/10 bg-[#1a1a1e] transition hover:border-white/30"
              >
                <img
                  src={image.urls.small}
                  alt={image.alt}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-104"
                  loading="lazy"
                />
               
              </button>
            ))}
          </div>

          {/* Load more */}
          {hasSearched && page < totalPages && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full cursor-pointer rounded border border-white/20 px-3 py-1.5 text-[10px] mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}