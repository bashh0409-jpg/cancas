"use client";

import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { gsap } from "gsap";
import { siDiscord, siInstagram, siYoutube } from "simple-icons";
import {
  AudioLines,
  ClockFading,
  Download,
  Fullscreen,
  Globe,
  LogOut,
  Clapperboard,
  Plus,
  Settings,
  SquarePause,
  SquarePlay,
  User,
  Volume2,
  VolumeOff,
  X,
} from "lucide-react";
import { CreateCanvasButton } from "@/app/components/CreateCanvasButton";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { CreditsBadge } from "@/app/components/home/CreditsBadge";
import { CanvasFileList } from "@/app/components/home/CanvasFileList";
import type { CanvasListItem } from "@/types/canvas";
import Tutorials from "./Tutorials";
import MuxPlayer from "@mux/mux-player-react";
import type MuxPlayerElement from "@mux/mux-player";
import type { MuxCSSProperties } from "@mux/mux-player-react";
import { tutorials, type TutorialItem } from "./tutorialData";
import type { UserSettings } from "@/lib/user/settingsRepository";
import { FolderIcon } from "@/public/icons/custom/FolderIcon";
import { TrashIcon } from "@/public/icons/custom/TrashIcon";
import { TutorialIcon } from "@/public/icons/custom/TutorialIcon";
import { LibraryIcon } from "@/public/icons/custom/LibraryIcon";
import { DeleteAccountModal } from "@/app/components/home/DeleteAccountModal";
import { useRouter } from "next/navigation";
import CanvasPlaceholderIcon from "../CanvasPlaceholderIcon";

type ActivePage =
  | "files"
  | "recently-deleted"
  | "settings"
  | "tutorials"
  | "library";

interface HomeShellProps {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  createCanvasAction: (idempotencyKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccountAction: (verificationCode: string) => Promise<void>;
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

function useUserRegion() {
  return useMemo(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Format timezone like "America/New_York" → "New York" or "Africa/Johannesburg" → "Johannesburg"
      const parts = timeZone.split("/");
      if (parts.length < 2) return timeZone;
      // Return the city/region part, replacing underscores with spaces
      return parts.slice(1).join(" - ").replace(/_/g, " ");
    } catch {
      return "Unknown";
    }
  }, []);
}

export function AccountCard({
  firstName,
  lastName,
  credits,
  photoUrl,
  onSignOut,
  onSettings,
  onClose,
}: {
  firstName: string;
  lastName: string;
  credits: number;
  photoUrl?: string;
  onSignOut: () => void;
  onSettings: () => void;
  onClose: () => void;
}) {
  const region = useUserRegion();
  const cardRef = useRef<HTMLDivElement>(null);

  const plan = credits > 1000 ? "Pro" : "Free";

  // Mount animation
  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: -6, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.18,
        ease: "power2.out",
      },
    );
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      className="absolute left-2 top-[70px] z-50 w-[250px] overflow-hidden rounded border border-white/10 bg-[#212126] shadow-2xl"
    >
      {/* User info header */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className=" flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded">
            {photoUrl ? (
              <Image
                width={96}
                height={96}
                src={photoUrl}
                alt={firstName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p className="text-sm font-medium text-black/60">
                {firstName.charAt(0).toUpperCase()}
              </p>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate capitalize text-xs font-medium leading-tight text-white">
              {lastName && lastName !== "User"
                ? `${firstName} ${lastName}`
                : firstName}
              &apos;s Workspace
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onSettings}
              className="flex h-7 w-7 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={onSignOut}
              className="flex h-7 w-7 items-center justify-center rounded text-white/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Credits row */}
      <div className="mb-1 mt-2 flex items-center justify-between px-3 py-2.5">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Credits</span>
          <div className="flex items-center gap-1">
            <Icon />
            <span>{credits}</span>
          </div>
        </div>

        <button className="bg-transparent text-xs text-white transition hover:bg-white/10">
          <span className="cursor-pointer underline">Upgrade for more</span>
        </button>
      </div>{" "}
      {/* Plan row */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Plan</span>
          <span>{plan}</span>
        </div>

        <button className="bg-transparent text-xs text-white transition hover:bg-white/10">
          <span className="cursor-pointer underline">Upgrade</span>
        </button>
      </div>
      {/* Region row */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/10">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Region</span>
          <span>{region}</span>
        </div>
        <Globe className="h-3.5 w-3.5 text-white/40" />
      </div>
      {/* Account Switcher */}
      <div className="border-t border-white/20 px-3 py-2.5">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Switch account</span>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <a
            href="/api/auth/google"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </a>
          <a
            href="/api/auth/azure"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="1.5"
                fill="#F25022"
              />
              <rect
                x="13"
                y="1"
                width="10"
                height="10"
                rx="1.5"
                fill="#7FBA00"
              />
              <rect
                x="1"
                y="13"
                width="10"
                height="10"
                rx="1.5"
                fill="#00A4EF"
              />
              <rect
                x="13"
                y="13"
                width="10"
                height="10"
                rx="1.5"
                fill="#FFB900"
              />
            </svg>
            Microsoft
          </a>
        </div>
      </div>
      {/* Feedback */}
      <div className="flex flex-col border-y border-white/20 px-3 py-2.5">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Feedback</span>
          <span>Let us know what you think about the app.</span>
        </div>

        <a
          href="https://form.typeform.com/to/zVygaA73"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 w-fit px-0.5 py-1 text-xs text-white transition hover:bg-white/10"
        >
          <span className="cursor-pointer underline">Submit feedback</span>
        </a>
      </div>
      {/* Bug report */}
      <div className="flex flex-col px-3 py-2.5">
        <div className="mono flex flex-col gap-1 text-xs tracking-tight text-white">
          <span>Bug report</span>
          <span>Report any issues you encounter in the app.</span>
        </div>

        <a
          href="https://form.typeform.com/to/kgiR8pAb"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 w-fit px-0.5 py-1 text-xs text-white transition hover:bg-white/10"
        >
          <span className="cursor-pointer underline">Submit bug report</span>
        </a>
      </div>
    </div>
  );
}

export function HomeShell({
  firstName,
  lastName,
  photoUrl,
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Auto-collapse on mobile, auto-expand on desktop
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [activePage, setActivePage] = useState<ActivePage>("files");
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<TutorialItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<MuxPlayerElement | null>(null);

  useEffect(() => {
    if (!selectedVideo) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  const openVideo = (video: TutorialItem) => {
    setSelectedVideo(video);
    setIsLoaded(false);
    setIsPlaying(true);
    setIsMuted(false);
  };

  const closeModal = () => {
    if (playerRef.current?.pause) {
      playerRef.current.pause();
    }
    setSelectedVideo(null);
    setIsPlaying(false);
    setIsLoaded(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause?.();
      setIsPlaying(false);
    } else {
      playerRef.current.play?.();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    playerRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const openFullscreen = () => {
    playerRef.current?.requestFullscreen?.();
  };

  const fullName =
    lastName && lastName !== "User" ? `${firstName} ${lastName}` : firstName;
  const labelsRef = useRef<HTMLElement[]>([]);
  const createBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const labels = labelsRef.current.filter(Boolean);
    const createBtn = createBtnRef.current;
    const targets = [...labels, ...(createBtn ? [createBtn] : [])];

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

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    setCurrentTime(playerRef.current.currentTime ?? 0);
    setDuration(playerRef.current.duration ?? 0);
  };

  return (
    <div className="flex h-screen border border-white/10">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          flex shrink-0 flex-col py-4 px-2 bg-black/40 backdrop-blur-md
          border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden
          relative
          ${collapsed ? "w-[52px]" : "w-[270px]"}
        `}
      >
        {/* ── Logo + collapse toggle ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex tracking-tight mb-8 items-center gap-2 min-w-0">
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="md:hidden flex items-center justify-center w-[34px] h-[24px] rounded hover:bg-white/10 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Image
                onClick={() => setAccountOpen((o) => !o)}
                src="/images/Reflow.svg"
                alt="Logo"
                width={84}
                height={24}
                className="object-contain cursor-pointer rounded shrink-0"
              />{" "}
              <span className="mono text-white/60  tracking-tight text-xs ml-2">
                BETA
              </span>
            </div>
          </div>
        </div>

        {/* ── Account button ── */}
        <div className="mb-2">
          <button
            onClick={() => setAccountOpen((o) => !o)}
            title={collapsed ? fullName : undefined}
            className={`
              cursor-pointer rounded-md flex items-center text-sm py-1
              text-white/70 hover:bg-white/10 transition-colors
              ${collapsed ? "justify-center px-0" : "justify-between px-1"}
            `}
          >
            <div
              className={`flex items-center ${collapsed ? "gap-0" : "gap-2.5"}`}
            >
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={firstName}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <span
                ref={addLabelRef as React.LegacyRef<HTMLSpanElement>}
                className={`whitespace-nowrap text-sm mono uppercase tracking-tight text-white ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
              >
                {fullName}
              </span>
            </div>
            <span
              ref={addLabelRef as React.LegacyRef<HTMLSpanElement>}
              className={`${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
            ></span>
          </button>
        </div>

        {/* ── Account card popup ── */}
        {accountOpen && (
          <AccountCard
            firstName={firstName}
            lastName={lastName}
            credits={credits}
            photoUrl={photoUrl}
            onClose={() => setAccountOpen(false)}
            onSettings={() => {
              setActivePage("settings");
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
          {/* Search - hidden on mobile when collapsed */}
          <div className={`mb-2 ${collapsed ? "hidden" : ""}`}>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded h-7  mono text-xs border border-white/20 bg-white/20 px-4 py-1 text-sm font-medium tracking-tight text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-900 ${collapsed ? "hidden" : ""}`}
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
          {/* Trash */}
          <NavItem
            icon={<Settings className="w-4 h-4 text-white" />}
            label="Settings"
            endIcon={<ClockFading className="hidden" />}
            active={activePage === "settings"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("settings")}
          />
        </nav>
        <div className="p-1 hidden w-full min-h-30">
          <div className="w-full bg-white/20 min-h-60 rounded"></div>
        </div>

        {/* ── Bottom links ── */}
        <div className="mt-auto flex flex-col gap-0.5 px-1">
          <SidebarLink
            href="https://www.instagram.com/reflowfyi?igsh=MXRlamY1MHE1ZmxmNA%3D%3D&utm_source=qr"
            icon={
              <svg
                role="img"
                viewBox="0 0 24 24"
                aria-label="Youtube"
                className="w-4 h-4 shrink-0 fill-current"
                dangerouslySetInnerHTML={{
                  __html: `<path d="${siInstagram.path}" />`,
                }}
              />
            }
            label="INSTAGRAM"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
          <SidebarLink
            href="https://youtube.com/@reflowfyi?si=QCnvJcY09fYOThJi"
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
            label="YOUTUBE"
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
            label="DISCORD"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
        </div>
      </aside>

      {/* ── App Main content ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">
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
            createCanvasAction={createCanvasAction}
          />
        )}
        {activePage === "library" && <LibraryPage canvases={canvases} />}
        {activePage === "recently-deleted" && <RecentlyDeletedPage />}
        {activePage === "tutorials" && <TutorialPage openVideo={openVideo} />}
        {activePage === "settings" && (
          <SettingsPage
            profile={profile}
            photoUrl={photoUrl}
            deleteAccountAction={deleteAccountAction}
            signOut={signOut}
            userSettings={userSettings}
            updateSettingsAction={updateSettingsAction}
            updateNicknameAction={updateNicknameAction}
          />
        )}
      </main>

      {selectedVideo && (
        <div
          className="fixed inset-0 cursor-pointer z-[999] grid place-items-center bg-black p-4 backdrop-blur-md sm:p-8"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="flex w-full max-w-5xl flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <article
              className="flex cursor-pointer w-full flex-col overflow-hidden rounded border border-black bg-[#111] shadow-[0_32px_100px_rgba(0,0,0,0.45)]"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative overflow-hidden bg-black">
                {!isLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  </div>
                )}

                <MuxPlayer
                  ref={playerRef}
                  playbackId={selectedVideo.playbackId}
                  metadata={{ video_title: selectedVideo.title }}
                  poster={selectedVideo.thumbnail}
                  autoPlay
                  muted={isMuted}
                  loop={true}
                  onCanPlay={() => setIsLoaded(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  className={`aspect-video mux w-full transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                  style={
                    {
                      width: "100%",
                      height: "100%",
                      minHeight: 0,
                      minWidth: 0,
                      objectFit: "cover",
                      "--media-object-fit": "cover",
                      "--controls": "none",
                      "--media-control-display": "none",
                    } as MuxCSSProperties
                  }
                />

                <div className="pointer-events-none absolute inset-0 z-20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            </article>

            <div className="flex w-fit min-w-[340px] h-8 items-center justify-between gap-4 rounded border border-black/10 bg-white pl-3 shadow-2xl">
              <div
                className="min-w-0 gap-1 cursor-pointer flex items-center"
                onClick={closeModal}
              >
                {" "}
                <Clapperboard className="w-4 h-4 stroke-[1.5] text-black/70" />
                <span className="mono min-w-[3rem] text-center uppercase text-xs ">
                  {duration > 0 ? `${formatTime(currentTime)}` : "00:00"}
                </span>
                <span className="text-xs mono uppercase tracking-tight truncate">
                  {selectedVideo.title}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded p-0.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded cursor-pointer p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isPlaying ? (
                    <SquarePause className="stroke-[1.9] hover:text-black  text-black/70 h-4.5 w-4.5" />
                  ) : (
                    <SquarePlay className="stroke-[1.9] hover:text-black  text-black/70 h-4.5 w-4.5" />
                  )}{" "}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded cursor-pointer stroke-[1.9] hover:text-black text-black/70 p-1.5 text-black transition-colors hover:bg-white"
                >
                  {isMuted ? (
                    <VolumeOff className="stroke-[1.9] hover:text-black text-black/70 h-4.5 w-4.5" />
                  ) : (
                    <Volume2 className="stroke-[1.9] hover:text-black text-black/70 h-4.5 w-4.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={openFullscreen}
                  className="rounded cursor-pointer p-1.5 text-black transition-colors hover:bg-white"
                >
                  <Fullscreen className="h-4 stroke-[1.9] hover:text-black  text-black/70 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  createCanvasAction,
}: {
  firstName: string;
  lastName: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  createCanvasAction?: (idempotencyKey: string) => Promise<void>;
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const filteredCanvases = canvases.filter((canvas) =>
    canvas.name.toLowerCase().includes(localSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col scrollbar-hidden overflow-x-hidden gap-4">
      <div className="flex flex-wrap  items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="mono capitalize text-sm tracking-tight text-white">
            {lastName && lastName !== "User"
              ? `${firstName} ${lastName}`
              : firstName}
            &apos;s Workspace
          </div>
        </div>
        <div className="flex items-center gap-1">
          {errorMessage && (
            <div className="rounded-xs border tracking-tight mono  border-rose-500/30 bg-red-400/30 p-1 text-xs w-fit text-rose-100">
              {errorMessage}
            </div>
          )}
          <CreditsBadge credits={credits} />
        </div>
      </div>
      <div className="">
        <Tutorials />
      </div>
      <div className="mt-8 flex sticky flex-wrap items-center justify-between gap-2 border-b pb-2">
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
              className="w-full mono rounded border border-white/20 bg-white/20 px-2 py-1 text-xs font-medium tracking-tight text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-900 sm:w-auto"
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
      <CanvasFileList
        canvases={filteredCanvases}
        createCanvasAction={createCanvasAction}
      />
    </div>
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
        <h2 className="text-white uppercase text-sm tracking-tight mono">
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

function SettingsPage({
  profile,
  photoUrl,
  deleteAccountAction,
  signOut,
  userSettings,
  updateSettingsAction,
  updateNicknameAction,
}: {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    nickname?: string | null;
  };
  photoUrl?: string;
  deleteAccountAction: (verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  userSettings: UserSettings;
  updateSettingsAction: (formData: FormData) => Promise<void>;
  updateNicknameAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"account" | "settings">("account");

  const safeProfile = profile ?? {
    nickname: "",
    firstName: "",
    lastName: "",
    email: "",
  };

  const fullName =
    safeProfile.nickname?.trim() ||
    (safeProfile.lastName && safeProfile.lastName !== "User"
      ? `${safeProfile.firstName} ${safeProfile.lastName}`
      : safeProfile.firstName
    ).trim();

  return (
    <div className="flex items-start  min-h-full ">
      <div className="flex flex-col w-full max-w-4xl">
        <div className="mb-8 hidden ">
          <h2 className="text-white uppercase text-sm tracking-tight mono">
            Settings
          </h2>
          <p className="text-white/50 text-xs mono">
            All account related settings will appear here.
          </p>
        </div>
        {/* nav tabs at top */}

        <nav className="flex gap-0.5   mb-8">
          <button
            onClick={() => setActiveTab("account")}
            className={`
              flex items-center cursor-pointer gap-2.5 px-3 py-1.5 h-8 rounded tracking-tight text-left transition-colors
              ${
                activeTab === "account"
                  ? "bg-white/20 text-white "
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <span className="text-sm mono tracking-tight uppercase">
              Account
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`
              flex items-center cursor-pointer gap-2.5 px-3 py-1 text-xs h-8 rounded tracking-tight text-left transition-colors
              ${
                activeTab === "settings"
                  ? "bg-white/20 text-white "
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <span className="text-sm mono tracking-tight uppercase">
              Settings
            </span>
          </button>
        </nav>

        {/* content */}
        <div>
          {activeTab === "account" && (
            <AccountInfoTab
              profile={safeProfile}
              fullName={fullName}
              photoUrl={photoUrl}
              updateNicknameAction={updateNicknameAction}
            />
          )}

          {activeTab === "settings" && (
            <WorkspaceSettingsTab
              deleteAccountAction={deleteAccountAction}
              signOut={signOut}
              userSettings={userSettings}
              updateSettingsAction={updateSettingsAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AccountInfoTab({
  profile,
  fullName,
  photoUrl,
  updateNicknameAction,
}: {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    nickname?: string | null;
  };
  fullName: string;
  photoUrl?: string;
  updateNicknameAction: (formData: FormData) => Promise<void>;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    gsap.to(containerRef.current, {
      scale: 1.12,
      rotate: 6,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(containerRef.current, {
      scale: 1,
      rotate: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  };

  const initialName = profile?.nickname?.trim() || fullName;

  const [nickname, setNickname] = useState(initialName);
  const [displayName, setDisplayName] = useState(initialName);

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);

    const trimmed = nickname.trim();

    if (!trimmed) return;

    const formData = new FormData();
    formData.append("nickname", trimmed);

    startTransition(async () => {
      await updateNicknameAction(formData);

      // why: reflect latest nickname instantly without refresh
      setDisplayName(trimmed);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* avatar */}
      <div className="flex items-center gap-5">
        <div
          ref={containerRef}
          className="lime flex h-24 w-24 shrink-0 items-center justify-center rounded-md overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {photoUrl ? (
            <div ref={imgRef} className="h-full w-full">
              <Image
                width={96}
                height={96}
                src={photoUrl}
                alt={displayName}
                className="h-full cursor-pointer w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <span className="text-2xl font-medium text-black">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="text-lg mono uppercase tracking-tight text-white">
            {displayName}
          </h2>

          <p className="text-[11px] uppercase mono tracking-tight text-white/40">
            Personal account settings
          </p>
        </div>
      </div>

      {/* fields */}
      <div className="flex flex-col gap-2">
        {/* nickname will be used later */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs mono uppercase tracking-tight text-white">
            Display Name
          </span>

          <div className="flex items-center gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nickname"
              className="
                h-9 w-full max-w-120
                rounded border capitalize border-transparent
                bg-white/10
                px-3
                text-xs text-white mono
                outline-none
                focus:border-white/10
              "
            />
          </div>
        </div>

        {/* email */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs mono tracking-tight  uppercase text-white">
            Email
          </span>

          <div className="flex h-9 max-w-120 items-center rounded bg-white/10 px-3 text-xs text-white/70 mono">
            {profile?.email ?? "No email"}
          </div>
        </div>

        {/* role */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs mono tracking-tight uppercase text-white">
            Role
          </span>

          <div className="flex h-9 max-w-120 items-center rounded bg-white/10 px-3 text-xs text-white/70 mono">
            Admin
          </div>
        </div>
        {/* region */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs mono tracking-tight uppercase text-white">
            Region
          </span>

          <div className="flex h-9 max-w-120 items-center rounded bg-white/10 px-3 text-xs text-white/70 mono">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={pending}
          className="
                flex h-8 w-fit items-center justify-center
                rounded bg-white px-3
                text-xs mono cursor-pointer uppercase tracking-tight font-medium text-black
                transition hover:bg-white/90
                disabled:opacity-50
              "
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            "Saved"
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}

function WorkspaceSettingsTab({
  deleteAccountAction,
  signOut,
  userSettings,
  updateSettingsAction,
}: {
  deleteAccountAction: (verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  userSettings: UserSettings;
  updateSettingsAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [productUpdates, setProductUpdates] = useState(
    userSettings.product_updates ?? true,
  );
  const [canvasActivity, setCanvasActivity] = useState(
    userSettings.canvas_activity ?? true,
  );
  const [saved, setSaved] = useState(false);
  const [saving, startTransition] = useTransition();

  async function handleSaveSettings() {
    setSaved(false);

    const formData = new FormData();
    formData.append("product_updates", String(productUpdates));
    formData.append("canvas_activity", String(canvasActivity));

    startTransition(async () => {
      await updateSettingsAction(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function handleDeleteAccount(verificationCode: string) {
    setDeleting(true);
    setDeleteError(null);
    setOpenDelete(false);

    try {
      await deleteAccountAction(verificationCode);
      await signOut();
      router.push("/signin");
    } catch (error) {
      setDeleting(false);
      setDeleteError(
        error instanceof Error
          ? error.message
          : String(error) || "Unable to delete account.",
      );
      setOpenDelete(true);
    }
  }

  return (
    <>
      <div className="flex max-w-xl flex-col gap-8">
        {/* header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-sm mono uppercase tracking-tight text-white">
            Workspace Settings
          </h2>

          <p className="text-sm font-normal mono tracking-tight text-white/60">
            Manage your plan, notifications, and account preferences.
          </p>
        </div>

        {/* plan */}
        <div className="flex flex-col gap-4">
          <span className="text-xs text-white tracking-tight uppercase mono">
            Plan
          </span>

          <div className="flex flex-col gap-4 rounded bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm  mono tracking-tight font-medium text-white">
                  Free
                </span>

                <span className="text-xs mono tracking-tight text-white/40">
                  Limited canvas creation · 100 credits / month
                </span>
              </div>

              <button className="h-8 mono cursor-pointer uppercase rounded bg-white px-3 text-xs font-medium text-black transition hover:bg-white/90">
                Upgrade
              </button>
            </div>
          </div>
        </div>

        {/* notifications */}
        <div className="flex flex-col gap-4">
          <span className="text-xs   uppercase mono tracking-tight text-white">
            Notifications
          </span>

          <div className="flex flex-col mono tracking-tight rounded bg-white/10 p-3">
            <Toggle
              label="Product updates"
              description="New features and announcements"
              checked={productUpdates}
              onChange={() => setProductUpdates((current) => !current)}
            />

            <div className="h-px bg-white/5" />

            <Toggle
              label="Canvas activity"
              description="Comments and edits on your canvases"
              checked={canvasActivity}
              onChange={() => setCanvasActivity((current) => !current)}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex h-8 min-w-[70px] cursor-pointer  font-medium cursor-pointer items-center justify-center self-end rounded bg-white px-3 text-xs  mono uppercase text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  "Saved"
                ) : (
                  "update"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* danger zone */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase mono tracking-tight text-white">
            Danger zone
          </span>

          <div className="flex items-center justify-between rounded bg-white/10 p-4">
            <div className="flex flex-col">
              <span className="text-sm mono tracking-tight text-white">
                Delete account
              </span>

              <span className="text-xs mono tracking-tight text-white/40">
                Permanently removes all your files and account data.
              </span>
            </div>

            <button
              onClick={() => setOpenDelete(true)}
              className="h-8 mono cursor-pointer uppercase cursor-pointer rounded border border-rose-500/30 px-3 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        open={openDelete}
        onClose={() => {
          if (!deleting) {
            setOpenDelete(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteAccount}
      />

      {deleteError ? (
        <div className="mt-4 rounded border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-200">
          {deleteError}
        </div>
      ) : null}

      {deleting ? (
        <div
          aria-label="Deleting account"
          aria-live="polite"
          className="fixed inset-0 z-[1000] grid place-items-center bg-black"
          role="status"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      ) : null}
    </>
  );
}

export function TutorialPage({
  openVideo,
}: {
  openVideo: (video: TutorialItem) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className="text-white uppercase text-sm tracking-tight mono">
          Tutorial Lessons.
        </h2>
        <p className="text-white/50 text-xs  mono">
          Tutorial videos will appear here. New video every week will be
          released.
        </p>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1  sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {tutorials.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openVideo(item)}
            className="w-full text-left cursor-pointer aspect-video overflow-hidden rounded bg-white/10 transition hover:bg-white/11 hover:border-white/10"
          >
            <div className="relative aspect-video h-full w-full">
              <MuxPlayer
                playbackId={item.playbackId}
                metadata={{ video_title: item.title }}
                poster={item.thumbnail}
                muted={true}
                loop={true}
                autoPlay={false}
                className="h-full mux w-full"
                style={
                  {
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    minWidth: 0,
                    objectFit: "cover",
                    "--media-object-fit": "cover",
                    "--controls": "none",
                    "--media-control-display": "none",
                  } as MuxCSSProperties
                }
              />

              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute left-3 bottom-3 right-3">
                <h3 className="text-white  text-xs mono font-medium tracking-tight">
                  {item.title}
                </h3>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 40;
type FileType = "image" | "web" | "voice";
type ActiveFilter = "all" | FileType;

const FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "web", label: "Web" },
  { value: "voice", label: "Voice" },
];

function LibraryPage({ canvases }: { canvases: CanvasListItem[] }) {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      type: FileType;
      title: string;
      thumbnail?: string;
      url?: string;
      audioDataUrl?: string;
      durationMs?: number;
      canvasName: string;
      canvasId: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ActiveFilter>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    title: string;
    canvasName: string;
    canvasId: string;
  } | null>(null);
  const [previewVoice, setPreviewVoice] = useState<{
    audioDataUrl: string;
    title: string;
    transcription?: string;
    canvasName: string;
    canvasId: string;
  } | null>(null);
  const [previewWeb, setPreviewWeb] = useState<{
    url: string;
    title: string;
    canvasName: string;
    canvasId: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAllFiles = async () => {
      try {
        if (canvases.length === 0) {
          if (mounted) setFiles([]);
          return;
        }

        const canvasIds = Array.from(new Set(canvases.map((canvas) => canvas.id)));
        const res = await fetch(
          `/api/canvases/library?ids=${encodeURIComponent(canvasIds.join(","))}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const allFiles: typeof files = [];

        for (const canvas of data.canvases ?? []) {
          const content = canvas.content as
            | {
                imageNodes?: Array<{ id: string; fileName: string; url?: string }>;
                webNodes?: Array<{ id: string; title: string; url: string }>;
                voiceNodes?: Array<{
                  id: string;
                  title: string;
                  audioDataUrl: string;
                  durationMs?: number;
                }>;
              }
            | undefined;

          if (content?.imageNodes) {
            content.imageNodes.forEach((node) => {
              allFiles.push({
                id: node.id,
                type: "image",
                title: node.fileName,
                thumbnail: node.url,
                url: node.url,
                canvasName: canvas.name,
                canvasId: canvas.id,
              });
            });
          }

          if (content?.webNodes) {
            content.webNodes.forEach((node) => {
              allFiles.push({
                id: node.id,
                type: "web",
                title: node.title || new URL(node.url).hostname,
                url: node.url,
                canvasName: canvas.name,
                canvasId: canvas.id,
              });
            });
          }

          if (content?.voiceNodes) {
            content.voiceNodes.forEach((node) => {
              allFiles.push({
                id: node.id,
                type: "voice",
                title: node.title,
                audioDataUrl: node.audioDataUrl,
                durationMs: node.durationMs,
                canvasName: canvas.name,
                canvasId: canvas.id,
              });
            });
          }
        }

        if (mounted) setFiles(allFiles);
      } catch {
        if (mounted) setFiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllFiles();
    return () => {
      mounted = false;
    };
  }, [canvases]);

  const filteredFiles =
    typeFilter === "all" ? files : files.filter((f) => f.type === typeFilter);
  const visibleFiles = filteredFiles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFiles.length;

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
        <h2 className="text-white uppercase  text-sm tracking-tight mono">
          My Library.
        </h2>
        <p className="text-white/50 text-xs mono">
          All files from all canvases will appear here.
        </p>
      </div>

      {/* Filter bar */}
      {!loading && files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTypeFilter(option.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`rounded px-2.5 py-1 cursor-pointer text-xs mono uppercase tracking-tight transition ${
                typeFilter === option.value
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin text-white/20" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="mb-3 flex aspect-square items-center justify-center rounded text-white/30 transition">
            <CanvasPlaceholderIcon />
          </div>
          <p className="text-white/50 tracking-tight uppercase text-xs mono text-center max-w-sm">
            No files yet. Create some canvases and add content to see them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(
            visibleFiles.reduce(
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
                <h3 className="text-white uppercase tracking-tight text-xs mono">
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
                      } else if (file.type === "web" && file.url) {
                        e.preventDefault();
                        setPreviewWeb({
                          url: file.url,
                          title: file.title,
                          canvasName: file.canvasName,
                          canvasId: file.canvasId,
                        });
                      } else if (file.type === "voice" && file.audioDataUrl) {
                        e.preventDefault();
                        setPreviewVoice({
                          audioDataUrl: file.audioDataUrl,
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
                        <p className="text-white/60 uppercase tracking-tight text-[10px] mono truncate">
                          {file.canvasName}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="flex items-center cursor-pointer gap-2 rounded border border-white/20 bg-white/5 px-2  py-1 text-xs mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Load More ({filteredFiles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] rounded overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 absolute top-1 right-1 z-10">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(previewImage.src);
                    const blob = await res.blob();

                    // Save to localStorage
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      localStorage.setItem(
                        `reflow:downloaded:${previewImage.title}`,
                        base64,
                      );
                    };
                    reader.readAsDataURL(blob);

                    // Trigger browser download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = previewImage.title;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {
                    // Silently fail
                  }
                }}
                className="cursor-pointer  z-10 p-1 bg-black/60 hover:bg-black/80 text-white rounded-xs transition"
                aria-label="Close preview"
              >
                <Download className="w-4 h-4" />
              </button>{" "}
              <button
                onClick={() => setPreviewImage(null)}
                className=" z-10 p-1 cursor-pointer mix-blend-difference bg-black/60 hover:bg-black/80 text-white rounded-xs transition"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Image
              src={previewImage.src}
              alt={previewImage.title}
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />

            {/* Image info footer + download */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm mono tracking-tight truncate max-w-full">
                    {previewImage.title}
                  </p>
                  <p className="text-white/60 tracking-tight max-w-full uppercase text-xs mono">
                    {previewImage.canvasName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Voice Preview Modal ── */}
      {previewVoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewVoice(null)}
        >
          <div
            className="relative w-full max-w-md mx-4 rounded-lg overflow-hidden bg-[#1a1a1e] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setPreviewVoice(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded transition"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
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

            <div className="p-6 flex flex-col items-center gap-4">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <AudioLines className="w-6 h-6 text-white" />
              </div>

              {/* Title */}
              <p className="text-white text-sm mono font-medium text-center truncate max-w-full">
                {previewVoice.title}
              </p>
              <p className="text-white/40 text-[10px] mono uppercase">
                {previewVoice.canvasName}
              </p>

              {/* Audio Player */}
              <audio
                src={previewVoice.audioDataUrl}
                className="w-full h-10 rounded"
              />

              {/* Transcription placeholder */}
              {previewVoice.transcription ? (
                <div className="w-full border-t border-white/10 pt-3 mt-1">
                  <p className="text-[10px] mono uppercase tracking-tight text-white/40 mb-2">
                    Transcription
                  </p>
                  <p className="text-xs mono text-white/70 leading-relaxed">
                    {previewVoice.transcription}
                  </p>
                </div>
              ) : (
                <div className="w-full border-t border-white/10 pt-3 mt-1">
                  <p className="text-[10px] mono uppercase tracking-tight text-white/30 text-center">
                    No transcription available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Web Link Preview Modal ── */}
      {previewWeb && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewWeb(null)}
        >
          <div className="relative w-full items-center max-w-md mx-4 flex flex-col gap-2 ">
            {" "}
            <div
              className="relative w-full max-w-md mx-4 rounded-lg overflow-hidden bg-white "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col  gap-4">
                {/* Globe icon */}
                <div className="w-14 h-14 rounded bg-black/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-black" />
                </div>

                {/* Website title */}
                <p className="text-black text-sm mono font-medium truncate max-w-full">
                  {previewWeb.title}
                </p>
                <p className="text-black/70 text-[10px] mono uppercase">
                  {previewWeb.canvasName}
                </p>

                {/* URL */}
                <p className="text-xs mono text-black/50 text-left break-all max-w-full  rounded  py-2">
                  Url:{previewWeb.url}
                </p>

                {/* Open in new tab */}
                <a
                  href={previewWeb.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" w-fit rounded uppercase tracking-tight bg-black px-4 py-1.5  text-xs mono font-medium text-white  text-center transition hover:bg-black/80"
                >
                  Open in New Tab
                </a>
              </div>
            </div>{" "}
            {/* Close */}
            <button
              onClick={() => setPreviewWeb(null)}
              className="z-10 p-1.5 bg-white cursor-pointer hover:bg-white/80 text-black rounded transition"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
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
        flex items-center h-8 rounded tracking-tight text-xs
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

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white text-sm">{label}</p>

        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>

      <button
        onClick={onChange}
        className={`relative w-11 cursor-pointer  h-5 rounded-full transition-colors duration-200 shrink-0 ${
          checked ? "bg-green-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-4 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-4 bg-white" : "bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}
