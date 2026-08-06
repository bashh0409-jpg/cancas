"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle, Plus, Search, X } from "lucide-react";
import gsap from "gsap";

type Topic = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type Article = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  tags: string[];
};

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Create your first canvas, upload files, and navigate the workspace.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    id: "canvas-basics",
    title: "Canvas Basics",
    description: "Pan, zoom, select nodes, layers, and infinite canvas controls.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    id: "ai-features",
    title: "AI Features",
    description: "Describe images, summarize docs, remove backgrounds, upscale.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    id: "billing",
    title: "Billing & Credits",
    description: "Plans, credit usage, top-ups, and payment questions.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect Google Drive, Dropbox, and OneDrive storage.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Upload failures, sync issues, performance, and known bugs.",
    icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
  },
];

const ARTICLES: Article[] = [
  {
    id: "create-canvas",
    topic: "getting-started",
    question: "How do I create a new canvas?",
    answer:
      "From the workspace home, click 'New Canvas', give it a name, and press Enter. Your canvas is saved automatically and appears in the canvas list on the left sidebar. You can rename it anytime by clicking its name in the sidebar header.",
    tags: ["canvas", "create", "new", "workspace"],
  },
  {
    id: "drop-files",
    topic: "getting-started",
    question: "How do I add files to a canvas?",
    answer:
      "Drag and drop files from your OS anywhere onto the canvas. Multiple files can be dropped at once — they'll be staggered so they don't stack. Supported types include images (PNG, JPEG, WebP), documents, spreadsheets, audio, and more.",
    tags: ["upload", "drop", "files", "drag"],
  },
  {
    id: "pan-zoom",
    topic: "canvas-basics",
    question: "How do I pan and zoom the canvas?",
    answer:
      "Pan with middle-mouse drag, or hold Space + left-drag. Zoom with the scroll wheel or trackpad pinch, clamped between 0.1x and 4x. Use the zoom controls in the bottom-right corner for precise steps.",
    tags: ["pan", "zoom", "view", "navigate"],
  },
  {
    id: "move-nodes",
    topic: "canvas-basics",
    question: "How do I move, resize, or delete nodes?",
    answer:
      "Click a node to select it (shows a selection outline). Drag to reposition. Corner handles resize. Press Delete or Backspace to remove the selected node, and Escape to deselect. Locked layers can't be moved until unlocked in the Layers panel.",
    tags: ["move", "resize", "delete", "select", "drag"],
  },
  {
    id: "describe-image",
    topic: "ai-features",
    question: "How does 'Describe' work for images?",
    answer:
      "Right-click an image node and choose 'Describe' (or set it as your default action in Settings). The image is sent to a vision model — currently Claude Sonnet 4 or GPT-4o — which returns a text description of the image contents in an output panel.",
    tags: ["ai", "describe", "image", "vision"],
  },
  {
    id: "remove-bg",
    topic: "ai-features",
    question: "How do I remove a background from an image?",
    answer:
      "Select the image node, then choose 'Remove Background' from the right-click menu. The processed PNG is placed next to the original. In Settings you can choose whether to keep the original image or replace it.",
    tags: ["ai", "background", "remove", "image", "edit"],
  },
  {
    id: "credits",
    topic: "billing",
    question: "How are credits counted?",
    answer:
      "AI actions like remove-background, upscale, describe, and chat consume credits. The remaining balance is shown in the top bar. When credits run out you'll need to top up from the billing page or wait for your plan's monthly reset.",
    tags: ["billing", "credits", "usage", "topup", "pay"],
  },
  {
    id: "connect-drive",
    topic: "integrations",
    question: "How do I connect Google Drive or Dropbox?",
    answer:
      "Open the sidebar, go to 'External storage', and click Connect on Google Drive or Dropbox. You'll be redirected to authorize the connection. Once connected, you can browse and import files directly into the canvas.",
    tags: ["drive", "dropbox", "onedrive", "cloud", "storage", "connect"],
  },
  {
    id: "upload-failing",
    topic: "troubleshooting",
    question: "My image upload is failing — what should I do?",
    answer:
      "Check that the file is under 50MB and that you're on a stable connection. If it persists, try a smaller file, hard-refresh the page (Cmd+Shift+R), and check the Supabase status. Pending uploads are queued and retried automatically when the connection stabilizes.",
    tags: ["upload", "fail", "error", "image", "sync"],
  },
  {
    id: "sync-issues",
    topic: "troubleshooting",
    question: "Changes aren't syncing between devices.",
    answer:
      "Each canvas saves locally and syncs to the server when online. If changes are missing, verify you're signed in on both devices, clear the browser cache, and check the network. Remote updates are merged in real-time when a connection is available.",
    tags: ["sync", "remote", "save", "device", "offline"],
  },
];

function ArticleItem({
  article,
  isOpen,
  onToggle,
}: {
  article: Article;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const answerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = answerRef.current;
    if (!element) return;

    gsap.killTweensOf(element);

    if (isOpen) {
      gsap.fromTo(
        element,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.4, ease: "power3.out" },
      );
    } else {
      gsap.to(element, { height: 0, opacity: 0, duration: 0.3, ease: "power3.inOut" });
    }

    return () => {
      gsap.killTweensOf(element);
    };
  }, [isOpen]);

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-white/[0.03] px-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="mono text-[10px] uppercase tracking-tight text-white/30 shrink-0">
            {isOpen ? "[-]" : "[+]"}
          </span>
          <span className="mono text-xs uppercase tracking-tight text-white/80 group-hover:text-white truncate">
            {article.question}
          </span>
        </div>
        <span className="mono hidden md:block text-[10px] uppercase tracking-tight text-white/30 shrink-0">
          {article.topic.replace(/-/g, " ")}
        </span>
      </button>

      <div
        ref={answerRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <p className="mono px-3 pb-5 pl-10 pr-8 text-[11px] uppercase leading-relaxed tracking-tight text-white/50">
          {article.answer}
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", topic: "General", message: "" });
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ARTICLES.filter((article) => {
      if (activeTopic && article.topic !== activeTopic) return false;

      if (!q) return true;

      const haystack = [
        article.question,
        article.answer,
        article.topic,
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, activeTopic]);

  const handleTopicClick = (topicId: string) => {
    setActiveTopic((current) => (current === topicId ? null : topicId));
    setOpenArticleId(null);
  };

  const handleMailtoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      // Try to save to the database first
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setFormSent(true);
        return;
      }

      // If API fails, fall back to mailto
      const subject = encodeURIComponent(`[Support] ${form.topic} — ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\n${form.message}`,
      );

      window.location.href = `mailto:hello@refly.ai?subject=${subject}&body=${body}`;
      setFormSent(true);
    } catch {
      // Network error — fall back to mailto
      const subject = encodeURIComponent(`[Support] ${form.topic} — ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\n${form.message}`,
      );

      window.location.href = `mailto:hello@refly.ai?subject=${subject}&body=${body}`;
      setFormSent(true);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#101010] text-white">
      {/* Top bar */}
      <header className="fixed z-50 flex w-full items-center justify-between p-4 font-mono text-xs uppercase tracking-tight mix-blend-difference">
        <Link href="/" className="flex items-center gap-1">
          <span className="font-medium">Reflow</span>
          <span className="text-white/60">/ Support</span>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <a href="/legal" className="transition hover:text-white/60">
            Legal
          </a>
          <a href="/support/runbook" className="transition hover:text-white/60">
            Runbook
          </a>
          <a
            href="/signin"
            className="rounded bg-white px-2 py-1 text-black transition hover:opacity-90"
          >
            Sign in
          </a>
        </nav>

        <a href="/support/runbook" className="rounded bg-white px-2 py-1 text-black md:hidden">
          Runbook
        </a>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 pb-16"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(160,160,160,0.1) 0px, rgba(160,160,160,0.1) 1px, transparent 1px, transparent 100%)",
          backgroundSize: "32px 100%",
        }}
      >
        {/* System status badge */}
        <div className="mb-8 flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
          </span>
          <span className="mono text-[10px] uppercase tracking-tight text-white/70">
            All systems operational
          </span>
        </div>

        <h1 className="mono max-w-3xl text-center text-4xl font-medium uppercase leading-[1.05] tracking-tighter md:text-6xl">
          How can we help<span className="text-lime">?</span>
        </h1>

        <p className="mono mt-4 max-w-md text-center text-xs uppercase leading-relaxed tracking-tight text-white/50">
          Search articles or browse topics below. Can&apos;t find an answer? Reach out on Discord or email us.
        </p>

        {/* Search */}
        <div className="mt-10 w-full max-w-xl">
          <div className="flex items-center gap-3 border-b-2 border-white/30 px-2 pb-2 transition focus-within:border-lime">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="mono w-full bg-transparent text-sm uppercase tracking-tight text-white outline-none placeholder:text-white/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-white/40 transition hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Topics grid ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => {
            const isActive = activeTopic === topic.id;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTopicClick(topic.id)}
                className={`group flex flex-col items-start gap-3 bg-[#101010] p-6 text-left transition ${
                  isActive ? "lime text-black" : "hover:bg-[#1a1a1a]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded transition ${
                    isActive ? "bg-black/10 text-black" : "bg-white/5 text-white/60"
                  }`}
                >
                  {topic.icon}
                </div>

                <span
                  className={`mono text-xs font-medium uppercase tracking-tight ${
                    isActive ? "text-black" : "text-white"
                  }`}
                >
                  {topic.title}
                </span>

                <span
                  className={`mono text-[10px] uppercase leading-relaxed tracking-tight ${
                    isActive ? "text-black/60" : "text-white/40"
                  }`}
                >
                  {topic.description}
                </span>

                <ArrowUpRight
                  className={`mt-2 h-4 w-4 transition ${
                    isActive ? "text-black" : "text-white/30 group-hover:text-white/70"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Articles ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="mono text-sm font-medium uppercase tracking-tight">
            {query || activeTopic
              ? "Search results"
              : "Popular help articles"}
          </h2>

          {(query || activeTopic) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveTopic(null);
              }}
              className="mono flex items-center gap-1 text-[10px] uppercase tracking-tight text-white/40 transition hover:text-white"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded border border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="mono text-xs uppercase tracking-tight text-white/50">
              No articles match your search.
            </p>
            <p className="mono mt-2 text-[10px] uppercase tracking-tight text-white/30">
              Try a different keyword, or contact support.
            </p>
          </div>
        ) : (
          <div className="border-t border-white/10">
            {filteredArticles.map((article) => (
              <ArticleItem
                key={article.id}
                article={article}
                isOpen={openArticleId === article.id}
                onToggle={() =>
                  setOpenArticleId((current) =>
                    current === article.id ? null : article.id,
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Contact / Support request ──────────────────────────────────── */}
      <section
        className="border-t border-white/10 bg-white/[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(160,160,160,0.08) 0px, rgba(160,160,160,0.08) 1px, transparent 1px, transparent 100%)",
          backgroundSize: "32px 100%",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2">
          {/* Left — contact channels */}
          <div>
            <h2 className="mono text-sm font-medium uppercase tracking-tight">
              Still need help?
            </h2>
            <p className="mono mt-3 max-w-sm text-[11px] uppercase leading-relaxed tracking-tight text-white/50">
              We typically respond within 24 hours on weekdays. For urgent
              issues, join the Discord community for faster answers.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href="mailto:hello@refly.ai"
                className="group flex items-center gap-3 border border-white/10 px-4 py-3 transition hover:border-lime hover:bg-lime hover:text-black"
              >
                <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="mono text-xs uppercase tracking-tight">
                  hello@refly.ai
                </span>
                <ArrowUpRight
                  className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100"
                  strokeWidth={1.5}
                />
              </a>

              <a
                href="https://discord.gg/vfstVqF3gk"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 border border-white/10 px-4 py-3 transition hover:border-lime hover:bg-lime hover:text-black"
              >
                <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="mono text-xs uppercase tracking-tight">
                  Join Discord
                </span>
                <ArrowUpRight
                  className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100"
                  strokeWidth={1.5}
                />
              </a>

              <a
                href="/support/runbook"
                className="group flex items-center gap-3 border border-white/10 px-4 py-3 transition hover:border-lime hover:bg-lime hover:text-black"
              >
                <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="mono text-xs uppercase tracking-tight">
                  View internal runbook
                </span>
                <ArrowUpRight
                  className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100"
                  strokeWidth={1.5}
                />
              </a>
            </div>
          </div>

          {/* Right — form (mailto fallback) */}
          <div className="rounded border border-white/10 bg-[#101010] p-6">
            {formSent ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <span className="mono text-2xl">✓</span>
                <h3 className="mono mt-4 text-sm font-medium uppercase tracking-tight">
                  Request submitted
                </h3>
                <p className="mono mt-2 max-w-xs text-[10px] uppercase leading-relaxed tracking-tight text-white/40">
                  Your support request has been received. We&apos;ll get back
                  to you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mono text-sm font-medium uppercase tracking-tight">
                  Send a request
                </h3>

                <form onSubmit={handleMailtoSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mono mb-1 block text-[10px] uppercase tracking-tight text-white/40">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="mono w-full rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-tight text-white outline-none transition placeholder:text-white/25 focus:border-lime"
                      />
                    </div>
                    <div>
                      <label className="mono mb-1 block text-[10px] uppercase tracking-tight text-white/40">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@company.com"
                        className="mono w-full rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-tight text-white outline-none transition placeholder:text-white/25 focus:border-lime"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mono rounded mb-1 block text-[10px] uppercase tracking-tight text-white/40">
                      Topic
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="mono rounded w-full cursor-pointer border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-tight text-white outline-none transition focus:border-lime"
                    >
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="AI Features">AI Features</option>
                      <option value="Integrations">Integrations</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Account">Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="mono mb-1 block text-[10px] uppercase tracking-tight text-white/40">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe the issue or question..."
                      className="mono w-full rounded resize-none border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase leading-relaxed tracking-tight text-white outline-none transition placeholder:text-white/25 focus:border-lime"
                    />
                  </div>

                  {formError && (
                    <p className="mono text-[10px] uppercase tracking-tight text-red-400">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="mono flex w-full lime rounded cursor-pointer items-center justify-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-tight text-black transition hover:opacity-90 disabled:opacity-50"
                  >
                    {formLoading ? "Submitting..." : "Send request"}
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}