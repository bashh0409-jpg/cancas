"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { siDiscord, siYoutube } from "simple-icons";
import {
  AudioLines,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClockFading,
  Globe,
  LogOut,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { CreateCanvasButton } from "@/app/components/CreateCanvasButton";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { CreditsBadge } from "@/app/components/home/CreditsBadge";
import { CanvasFileList } from "@/app/components/home/CanvasFileList";
import type { CanvasListItem } from "@/types/canvas";
import { AccountPage } from "@/app/components/home/AccountPage";
import Tutorials from "./Tutorials";
import type { UserSettings } from "@/lib/user/settingsRepository";
import { FolderIcon } from "@/public/icons/custom/FolderIcon";
import { TrashIcon } from "@/public/icons/custom/TrashIcon";
import { TutorialIcon } from "@/public/icons/custom/TutorialIcon";
import { LibraryIcon } from "@/public/icons/custom/LibraryIcon";

type ActivePage =
  | "files"
  | "account"
  | "recently-deleted"
  | "tutorials"
  | "library";

interface HomeShellProps {
  firstName: string;
  lastName: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  createCanvasAction: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccountAction: () => Promise<void>;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    nickname?: string | null;
  };
  updateNicknameAction: (formData: FormData) => Promise<void>;
  updateSettingsAction: (formData: FormData) => Promise<void>;
  userSettings: UserSettings;
}

// ── Account card popup ─────────────────────────────────────────────────────
export function AccountCard({
  firstName,
  lastName,
  credits,
  onSignOut,
  onSettings,
  onClose,
}: {
  firstName: string;
  lastName: string;
  credits: number;
  onSignOut: () => void;
  onSettings: () => void;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const plan = credits > 1000 ? "Pro" : "Free";

  // Mount animation
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: -6, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out" },
    );
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Defer so the opening click doesn't immediately close
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      className="absolute left-2 top-[80px] z-50 w-[250px] rounded-md border border-white/10 bg-[#212126] shadow-2xl overflow-hidden"
    >
      {/* User info header */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 shrink-0 rounded lime flex items-center justify-center">
            <p className="text-black/60 text-sm font-medium">
              {firstName.charAt(0)}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white leading-tight">
              {firstName} {lastName}&apos;s Workspace
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onSettings}
              className="flex h-7 w-7 items-center justify-center rounded-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={onSignOut}
              className="flex h-7 w-7 items-center justify-center rounded-xs text-white/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Credits row */}
      <div className="px-3 py-2.5 mb-1 mt-2 flex items-center justify-between">
        <div className="flex flex-col gap-1 text-white mono tracking-tight text-xs">
          <span>Credits</span>
          <div className="flex gap-1 ">
            <Icon /> <span>{credits}</span>
          </div>
        </div>
        <button className="text-xs text-white bg-transparent hover:bg-white/10 underligned">
          <span className="underline cursor-pointer">Upgrade for more</span>
        </button>
      </div>
      {/* Plan row */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex flex-col gap-1 text-white mono tracking-tight text-xs">
          <span>Plan</span>
          <div className="flex gap-1 ">
            <span>{plan}</span>
          </div>
        </div>
        <button className="text-xs text-white bg-transparent hover:bg-white/10 underligned">
          <span className="underline cursor-pointer">Upgrade</span>
        </button>
      </div>
      {/* Feedback */}
      <div className="px-3 py-2.5 flex flex-col border-y border-white/20  justify-between">
        <div className="flex flex-col gap-1 text-white mono tracking-tight text-xs">
          <span>Feedback</span>
          <div className=" ">
            <span>Let us know what you think about the app.</span>
          </div>
        </div>
        <a
          href="https://form.typeform.com/to/zVygaA73"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mt-1 w-fit text-white py-1 px-0.5 bg-transparent hover:bg-white/10 underligned"
        >
          <span className="underline cursor-pointer">Submit feedback</span>
        </a>
      </div>
      {/* bug report */}
      <div className="px-3 py-2.5 flex flex-col  justify-between">
        <div className="flex flex-col gap-1 text-white mono tracking-tight text-xs">
          <span>Bug report</span>
          <div className=" ">
            <span>Report any issues you encounter in the app.</span>
          </div>
        </div>
        <a
          href="https://form.typeform.com/to/kgiR8pAb"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mt-1 w-fit py-1 px-0.5 text-white bg-transparent hover:bg-white/10 underligned"
        >
          <span className="underline cursor-pointer">Submit bug report</span>
        </a>
      </div>
    </div>
  );
}

export function HomeShell({
  firstName,
  lastName,
  canvases,
  credits,
  projectsError,
  errorMessage,
  createCanvasAction,
  signOut,
  deleteAccountAction,
  profile,
  updateNicknameAction,
  updateSettingsAction,
  userSettings,
}: HomeShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("files");
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fullName = `${firstName} ${lastName}`;
  const labelsRef = useRef<HTMLElement[]>([]);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const createBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const labels = labelsRef.current.filter(Boolean);
    const wordmark = wordmarkRef.current;
    const createBtn = createBtnRef.current;
    const targets = [
      ...labels,
      ...(wordmark ? [wordmark] : []),
      ...(createBtn ? [createBtn] : []),
    ];

    if (collapsed) {
      gsap.to(targets, {
        opacity: 0,
        x: -6,
        duration: 0.15,
        ease: "power2.in",
        stagger: 0.02,
      });
    } else {
      gsap.fromTo(
        targets,
        { opacity: 0, x: -6 },
        {
          opacity: 1,
          x: 0,
          duration: 0.2,
          ease: "power2.out",
          stagger: 0.03,
          delay: 0.1,
        },
      );
    }
  }, [collapsed]);

  const addLabelRef = (el: HTMLElement | null) => {
    if (el && !labelsRef.current.includes(el)) {
      labelsRef.current.push(el);
    }
  };

  return (
    <div className="flex h-screen border border-white/10">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex shrink-0 flex-col py-4 px-2 bg-black/40 backdrop-blur-md
          border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden
          relative
          ${collapsed ? "w-[52px]" : "w-[270px]"}
        `}
      >
        {/* ── Logo + collapse toggle ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex hidden items-center gap-2 min-w-0">
            <div className="shrink-0"></div>
            <div
              ref={wordmarkRef}
              className={`flex items-center gap-1.5 overflow-hidden whitespace-nowrap ${collapsed ? "pointer-events-none" : ""}`}
            >
              <span className="text-white text-base font-semibold uppercase tracking-widest leading-none">
                SWIPED
              </span>
              <span className="uppercase bg-white/10 text-[9px] text-white/50 px-1.5 py-0.5 rounded font-semibold tracking-wide leading-none">
                BETA
              </span>
            </div>
          </div>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 flex hidden items-center justify-center w-6 h-6 rounded-md
              text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* ── Account button ── */}
        <div className="px-1 mb-4">
          <button
            onClick={() => setAccountOpen((o) => !o)}
            title={collapsed ? fullName : undefined}
            className={`
              w-[70%] rounded-md flex items-center text-sm py-1
              text-white/70 hover:bg-white/10 transition-colors
              ${collapsed ? "justify-center px-0" : "justify-between px-2"}
            `}
          >
            <div
              className={`flex items-center ${collapsed ? "gap-0" : "gap-2.5"}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                ref={addLabelRef as React.LegacyRef<HTMLSpanElement>}
                className={`whitespace-nowrap mono uppercase text-white ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
              >
                {fullName}
              </span>
            </div>
            <span
              ref={addLabelRef as React.LegacyRef<HTMLSpanElement>}
              className={`${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>
        </div>

        {/* ── Account card popup ── */}
        {accountOpen && (
          <AccountCard
            firstName={firstName}
            lastName={lastName}
            credits={credits}
            onClose={() => setAccountOpen(false)}
            onSettings={() => {
              setActivePage("account");
              setAccountOpen(false);
            }}
            onSignOut={() => signOut()}
          />
        )}

        {/* ── Create button ── */}
        <div
          ref={createBtnRef}
          className={`px-1 mb-4 ${collapsed ? "pointer-events-none" : ""}`}
        ></div>

        {/* ── Nav items ── */}
        <nav className="flex flex-col gap-2 px-1">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded h-8 mono text-xs border border-white/20 bg-white/20 px-4 py-1 text-sm font-medium tracking-tight text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-900 "
            />
          </div>

          {/* Create */}
          <CreateCanvasButton
            createCanvasAction={createCanvasAction}
            collapsed={collapsed}
            labelRef={addLabelRef}
          />

          {/* Files */}
          <NavItem
            icon={<FolderIcon className="w-4 h-4" />}
            label="My Files"
            endIcon={<Plus className="w-3.5 h-3.5 opacity-50" />}
            active={activePage === "files"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("files")}
          />
          {/* Library */}
          <NavItem
            icon={<LibraryIcon className="w-4 h-4 text-white" />}
            label="Library"
            endIcon={<ClockFading className="hidden" />}
            active={activePage === "library"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("library")}
          />
          {/* Tutorials */}
          <NavItem
            icon={<TutorialIcon className="w-4 h-4 text-white" />}
            label="Tutorials"
            endIcon={<ClockFading className="hidden" />}
            active={activePage === "tutorials"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("tutorials")}
          />

          {/* Trash */}
          <NavItem
            icon={<TrashIcon className="w-4 h-4 text-white" />}
            label="Trash"
            endIcon={<ClockFading className="hidden" />}
            active={activePage === "recently-deleted"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("recently-deleted")}
          />
        </nav>
        <div className="p-1 hidden w-full min-h-30">
          <div className="w-full bg-white/20 min-h-60 rounded"></div>
        </div>

        {/* ── Bottom links ── */}
        <div className="mt-auto flex flex-col gap-0.5 px-1">
          <SidebarLink
            href="https://youtube.com/@swiped-h2u?si=lfJd-iQSIMv0an7X"
            icon={
              <svg
                role="img"
                viewBox="0 0 24 24"
                aria-label="Youtube"
                className="w-4 h-4 shrink-0 fill-current"
                dangerouslySetInnerHTML={{
                  __html: `<path d="${siYoutube.path}" />`,
                }}
              />
            }
            label="Youtube"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
          <SidebarLink
            href="https://discord.gg/xexnRhqBP"
            icon={
              <svg
                role="img"
                viewBox="0 0 24 24"
                aria-label="Discord"
                className="w-4 h-4 shrink-0 fill-current"
                dangerouslySetInnerHTML={{
                  __html: `<path d="${siDiscord.path}" />`,
                }}
              />
            }
            label="Discord"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto p-8 flex flex-col gap-4">
        {activePage === "files" && (
          <FilesPage
            firstName={firstName}
            lastName={lastName}
            canvases={canvases}
            credits={credits}
            projectsError={projectsError}
            errorMessage={errorMessage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {activePage === "account" && (
          <AccountPage
            profile={profile}
            updateNicknameAction={updateNicknameAction}
            updateSettingsAction={updateSettingsAction}
            userSettings={userSettings}
            deleteAccountAction={deleteAccountAction}
            signOut={signOut}
          />
        )}
        {activePage === "tutorials" && <TutorialPage />}
        {activePage === "library" && <LibraryPage canvases={canvases} />}
        {activePage === "recently-deleted" && <RecentlyDeletedPage />}
      </main>
    </div>
  );
}

// ── Sub-pages ──────────────────────────────────────────────────────────────

function FilesPage({
  firstName,
  lastName,
  canvases,
  credits,
  projectsError,
  errorMessage,
  searchQuery = "",
  onSearchChange = () => {},
}: {
  firstName: string;
  lastName: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const filteredCanvases = canvases.filter((canvas) =>
    canvas.name.toLowerCase().includes(localSearch.toLowerCase()),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="mono text-sm tracking-tight text-white">
            {firstName} {lastName}&apos;s Workspace
          </div>

          <div className="pixel hidden flex items-center gap-2 rounded-md bg-white/20 px-3 py-2 text-sm text-white">
            Unlock unlimited creation
            <span className="rounded bg-blue-500 px-2 py-1 text-xs">
              Upgrade to Pro
            </span>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-xs border tracking-tight mono  border-rose-500/30 bg-red-400/30 p-1 text-xs w-fit text-rose-100">
            {errorMessage}
          </div>
        )}
        <CreditsBadge credits={credits} />
      </div>
      <div className="">
        <Tutorials />
      </div>
      <div className="mt-8 flex sticky flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h2 className="mono text-sm tracking-tight text-white">My Files</h2>
        <div className="flex items-center gap-2">
          <div>
            <input
              type="text"
              placeholder="Search files..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange(e.target.value);
              }}
              className="w-full mono rounded border border-white/20 bg-white/20 px-4 py-1 text-xs font-medium tracking-tight text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-900 sm:w-auto"
            />
          </div>
        </div>
      </div>{" "}
      {projectsError && (
        <div
          onClick={() => window.location.reload()}
          className="rounded-xs cursor-pointer   w-fit border border-amber-500/30 bg-amber-500/10 p-1 text-xs mono tracking-tight text-amber-100"
        >
          {projectsError} Something went wrong. Please refresh to try again.
          <button
            onClick={() => window.location.reload()} // forces full page refresh
            type="button"
            className="ml-4 cursor-pointer bg-white p-1 rounded-xs text-black"
          >
            Refresh
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xs border tracking-tight mono  border-rose-500/30 bg-red-400/30 p-1 text-xs w-fit text-rose-100">
          {errorMessage}
        </div>
      )}
      <CanvasFileList canvases={filteredCanvases} />
    </>
  );
}

function RecentlyDeletedPage() {
  const [loading, setLoading] = useState(true);
  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/canvases/trashed");
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setCanvases(json.canvases ?? []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-white text-sm tracking-tight mono">
          Recently Deleted
        </h2>
        <p className="text-white/50 text-xs mono">
          All recently deleted files will appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <CanvasFileList canvases={canvases} isTrash />
      )}
    </div>
  );
}

type TutorialItem = {
  id: string;
  title: string;
  description: string;
};

const tutorials: TutorialItem[] = [
  {
    id: "1",
    title: "Getting Started with Canvas",
    description: "",
  },
  {
    id: "2",
    title: "Creating and Managing Projects",
    description: "",
  },
  {
    id: "3",
    title: "Working with Images",
    description: "",
  },
  {
    id: "4",
    title: "Text and Typography",
    description: "",
  },
  {
    id: "5",
    title: "Advanced Layout Techniques",
    description: "",
  },
  {
    id: "6",
    title: "Exporting Your Work",
    description: "",
  },
  {
    id: "7",
    title: "Collaboration Features",
    description: "",
  },
  {
    id: "8",
    title: "Keyboard Shortcuts & Tips",
    description: "",
  },
  {
    id: "9",
    title: "Design System Setup",
    description: "",
  },
  {
    id: "10",
    title: "Performance Optimization",
    description: "",
  },
  {
    id: "11",
    title: "Prototyping and Animation",
    description: "",
  },
  {
    id: "12",
    title: "Best Practices Guide",
    description: "",
  },
];

function TutorialPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className="text-white text-sm tracking-tight mono">
          Tutorial Lessons.
        </h2>
        <p className="text-white/50 text-xs  mono">
          Tutorial videos will appear here. New video every week will be
          released.
        </p>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {tutorials.map((item) => (
          <div
            key={item.id}
            className="w-full cursor-pointer aspect-video rounded bg-white/10 p-3 hover:bg-white/15 transition flex flex-col justify-between"
          >
            <div>
              <h3 className="text-white text-xs mono font-medium tracking-tight">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function LibraryPage({ canvases }: { canvases: CanvasListItem[] }) {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      type: "image" | "web" | "voice";
      title: string;
      thumbnail?: string;
      canvasName: string;
      canvasId: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    title: string;
    canvasName: string;
    canvasId: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAllFiles = async () => {
      try {
        const allFiles: typeof files = [];

        for (const canvas of canvases) {
          try {
            const res = await fetch(`/api/canvases/${canvas.id}`);
            if (!res.ok) continue;

            const data = await res.json();
            const content = data.content;

            if (content?.imageNodes) {
              content.imageNodes.forEach(
                (node: { id: string; fileName: string; url?: string }) => {
                  allFiles.push({
                    id: node.id,
                    type: "image",
                    title: node.fileName,
                    thumbnail: node.url,
                    canvasName: canvas.name,
                    canvasId: canvas.id,
                  });
                },
              );
            }

            if (content?.webNodes) {
              content.webNodes.forEach(
                (node: { id: string; title: string; url: string }) => {
                  allFiles.push({
                    id: node.id,
                    type: "web",
                    title: node.title || new URL(node.url).hostname,
                    canvasName: canvas.name,
                    canvasId: canvas.id,
                  });
                },
              );
            }

            if (content?.voiceNodes) {
              content.voiceNodes.forEach(
                (node: { id: string; title: string }) => {
                  allFiles.push({
                    id: node.id,
                    type: "voice",
                    title: node.title,
                    canvasName: canvas.name,
                    canvasId: canvas.id,
                  });
                },
              );
            }
          } catch {
            // Continue if one canvas fails
          }
        }

        if (mounted) setFiles(allFiles);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllFiles();
    return () => {
      mounted = false;
    };
  }, [canvases]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        );
      case "web":
        return <Globe className="h-4.5 w-4.5 shrink-0" />;
      case "voice":
        return <AudioLines className="h-4.5 w-4.5 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-white text-sm tracking-tight mono">My Library.</h2>
        <p className="text-white/50 text-xs mono">
          All files from all canvases will appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin text-white" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-white/50 text-sm mono">
            No files yet. Create some canvases and add content to see them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(
            files.reduce(
              (acc, file) => {
                if (!acc[file.canvasId]) {
                  acc[file.canvasId] = { name: file.canvasName, files: [] };
                }
                acc[file.canvasId].files.push(file);
                return acc;
              },
              {} as Record<string, { name: string; files: typeof files }>,
            ),
          ).map(([canvasId, group]) => (
            <div key={canvasId} className="flex flex-col gap-4">
              {/* Canvas title divider */}
              <div className="flex items-center gap-3">
                <h3 className="text-white text-sm mono font-medium">
                  {group.name}
                </h3>
                <div className="flex-1  h-px bg-white/10"></div>
              </div>

              {/* Files grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1">
                {group.files.map((file) => (
                  <a
                    key={`${file.canvasId}-${file.id}`}
                    href={`/canvas/${file.canvasId}`}
                    onClick={(e) => {
                      if (file.type === "image" && file.thumbnail) {
                        e.preventDefault();
                        setPreviewImage({
                          src: file.thumbnail,
                          title: file.title,
                          canvasName: file.canvasName,
                          canvasId: file.canvasId,
                        });
                      }
                    }}
                    className="group relative rounded-xs overflow-hidden bg-white/5 hover:bg-white/10 transition-colors h-28 flex flex-col items-center justify-center cursor-pointer border border-white/10 hover:border-white/20"
                  >
                    {file.thumbnail && file.type === "image" ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={file.thumbnail}
                          alt={file.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:opacity-75  transition-opacity"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/60">
                        {getFileIcon(file.type)}
                      </div>
                    )}

                    {/* Overlay with title */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-end p-2">
                      <div className="w-full">
                        <p className="text-white text-xs mono font-medium truncate">
                          {file.title}
                        </p>
                        <p className="text-white/60 text-[10px] mono truncate">
                          {file.canvasName}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded transition"
              aria-label="Close preview"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <Image
              src={previewImage.src}
              alt={previewImage.title}
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />

            {/* Image info footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm mono font-medium">
                {previewImage.title}
              </p>
              <p className="text-white/60 text-xs mono">
                {previewImage.canvasName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  endIcon,
  active,
  collapsed,
  labelRef,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  endIcon?: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  labelRef: (el: HTMLElement | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`
        w-full h-8 cursor-pointer mt-1 rounded flex items-center text-sm font-light
        text-white hover:bg-white/15 transition-colors
        ${active ? "bg-white/15" : "hover:bg-white/10"}
        ${collapsed ? "justify-center h-8 w-8 px-0" : "justify-between px-2"}
      `}
    >
      <div className={`flex items-center ${collapsed ? "gap-0" : "gap-2"}`}>
        <span className="shrink-0 flex items-center justify-center">
          {icon}
        </span>
        <span
          ref={labelRef as React.LegacyRef<HTMLSpanElement>}
          className={`whitespace-nowrap mono uppercase text-xs font-medium ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
        >
          {label}
        </span>
      </div>
      {!collapsed && <span className="shrink-0">{endIcon}</span>}
    </button>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
  labelRef,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  labelRef: (el: HTMLElement | null) => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={collapsed ? label : undefined}
      className={`
        flex items-center h-8 rounded tracking-tight text-sm
        text-white mono hover:bg-white/10 transition-colors
        ${collapsed ? "justify-center px-0 gap-0" : "gap-2.5 px-2"}
      `}
    >
      <span className="shrink-0 flex items-center justify-center">{icon}</span>
      <span
        ref={labelRef as React.LegacyRef<HTMLSpanElement>}
        className={`whitespace-nowrap ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
      >
        {label}
      </span>
    </a>
  );
}

function Icon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
