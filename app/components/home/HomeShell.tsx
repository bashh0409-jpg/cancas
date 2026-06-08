"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { siDiscord, siYoutube } from "simple-icons";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClockFading,
  Folder,
  LogOut,
  Plus,
  Settings,
  Trash2,
  User,
  Play,
  Expand
} from "lucide-react";
import { CreateCanvasButton } from "@/app/components/CreateCanvasButton";
import { CreditsBadge } from "@/app/components/home/CreditsBadge";
import { CanvasFileList } from "@/app/components/home/CanvasFileList";
import type { CanvasListItem } from "@/types/canvas";
import { AccountPage } from "@/app/components/home/AccountPage";
import Tutorials from "./Tutorials";

type ActivePage = "files" | "account" | "recently-deleted";

interface HomeShellProps {
  firstName: string;
  lastName: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  createCanvasAction: () => Promise<void>;
  signOut: (formData: FormData) => Promise<void>;
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={onSignOut}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
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
}: HomeShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("files");
  const [accountOpen, setAccountOpen] = useState(false);

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
                Slate
              </span>
              <span className="uppercase bg-white/10 text-[9px] text-white/50 px-1.5 py-0.5 rounded font-semibold tracking-wide leading-none">
                BETA
              </span>
            </div>
          </div>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md
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
              text-white/70 hover:bg-white/10 hover:text-white transition-colors
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
                className={`whitespace-nowrap text-sm ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
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
            onSignOut={() => signOut(new FormData())}
          />
        )}

        {/* ── Create button ── */}
        <div
          ref={createBtnRef}
          className={`px-1 mb-4 ${collapsed ? "pointer-events-none" : ""}`}
        >
          <CreateCanvasButton createCanvasAction={createCanvasAction} />
        </div>
        {/* ── Nav items ── */}
        <nav className="flex flex-col gap-2 px-1">
          <NavItem
            icon={<Folder className="w-4 h-4" />}
            label="My Files"
            endIcon={<Plus className="w-3.5 h-3.5 opacity-50" />}
            active={activePage === "files"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("files")}
          />
          <NavItem
            icon={<Trash2 className="w-4 h-4" />}
            label="Trash"
            endIcon={<ClockFading className="w-3.5 h-3.5 opacity-50" />}
            active={activePage === "recently-deleted"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("recently-deleted")}
          />
          {/* Future nav items can go here 
          <NavItem
            icon={<User className="w-4 h-4" />}
            label="Account"
            endIcon={<Settings className="w-3.5 h-3.5 opacity-50" />}
            active={activePage === "account"}
            collapsed={collapsed}
            labelRef={addLabelRef}
            onClick={() => setActivePage("account")}
          />*/}
        </nav>

        {/* ── Bottom links ── */}
        <div className="mt-auto flex flex-col gap-0.5 px-1">
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
            createCanvasAction={createCanvasAction}
          />
        )}
        {activePage === "account" && <AccountPage />}
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
  createCanvasAction,
}: {
  firstName: string;
  lastName: string;
  canvases: CanvasListItem[];
  credits: number;
  projectsError: string | null;
  errorMessage: string | undefined;
  createCanvasAction: () => Promise<void>;
}) {
const scrollRef = useRef<HTMLDivElement>(null);

const [canScrollRight, setCanScrollRight] = useState(true);

const updateScrollState = () => {
  const el = scrollRef.current;

  if (!el) return;

  // prevents tiny sub-pixel inaccuracies at the end
  const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;

  setCanScrollRight(!isAtEnd);
};

useEffect(() => {
  updateScrollState();

  const el = scrollRef.current;

  if (!el) return;

  el.addEventListener("scroll", updateScrollState);

  return () => {
    el.removeEventListener("scroll", updateScrollState);
  };
}, []);

const handleScroll = () => {
  scrollRef.current?.scrollBy({
    left: 220,
    behavior: "smooth",
  });
};

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => createCanvasAction()}
            className="pixel hidden cursor-pointer rounded-lg bg-white/20 px-3 py-2 text-sm text-white"
          >
            New File
          </button>

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

        <CreditsBadge credits={credits} />
      </div>
      <Tutorials />
      <div className="mt-2 flex sticky flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h2 className="mono text-sm tracking-tight text-white">My Files</h2>

        <div>
          <input
            type="text"
            placeholder="Search files..."
            className="w-full mono rounded border border-white/20 bg-white/20 px-4 py-1 text-xs font-medium tracking-tight text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-900 sm:w-auto"
          />
        </div>
      </div>
      {projectsError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          {projectsError}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      )}
      <CanvasFileList canvases={canvases} />
    </>
  );
}

function RecentlyDeletedPage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-white text-sm tracking-tight mono">Recently Deleted</h2>
      <p className="text-white/50 text-xs mono">
        Files moved here are permanently deleted after 30 days.
      </p>
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
        w-full h-10 rounded-md flex items-center text-sm font-light
        text-white transition-colors
        ${active ? "bg-white/15" : "hover:bg-white/10"}
        ${collapsed ? "justify-center px-0" : "justify-between px-2"}
      `}
    >
      <div className={`flex items-center ${collapsed ? "gap-0" : "gap-2"}`}>
        <span className="shrink-0 flex items-center justify-center">
          {icon}
        </span>
        <span
          ref={labelRef as React.LegacyRef<HTMLSpanElement>}
          className={`whitespace-nowrap ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}
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
        text-white mono  hover:text-white hover:bg-white/10 transition-colors
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
