"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { siDiscord, siYoutube } from "simple-icons";
import {
  BadgeQuestionMark,
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
} from "lucide-react";
import { CreateCanvasButton } from "@/app/components/CreateCanvasButton";
import { CreditsBadge } from "@/app/components/home/CreditsBadge";
import { CanvasFileList } from "@/app/components/home/CanvasFileList";
import type { CanvasListItem } from "@/types/canvas";
import { AccountPage } from "@/app/components/home/AccountPage";

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
function AccountCard({
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
          <div className="w-7 h-7 rounded lime flex items-center justify-center shrink-0">
            <div className="font-sm items-center flex justify-center">
              <p className="text-black/50 text-sm items-center">
                {firstName.charAt(0)}
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium leading-tight truncate">
              {firstName} {lastName}&apos;s Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Credits row */}
      <div className="px-3 py-2.5 mb-2 mt-4 flex items-center justify-between">
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

      {/* Actions */}
      <div className="p-1.5 border-t border-white/10 flex flex-col gap-0.5">
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white hover:text-white hover:bg-white/10 transition-colors text-left"
        >
          <Settings className="w-4.5 h-4.5" />
          Settings
        </button>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white  hover:bg-rose-500/10 transition-colors text-left"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign out
        </button>
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
            label="Recently Deleted"
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
            href="/app/docs"
            icon={<BadgeQuestionMark className="w-4 h-4" />}
            label="Help"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
          <SidebarLink
            href="https://youtube.com/slateai"
            icon={
              <svg
                role="img"
                viewBox="0 0 24 24"
                aria-label="YouTube"
                className="w-4 h-4 shrink-0 fill-current"
                dangerouslySetInnerHTML={{
                  __html: `<path d="${siYoutube.path}" />`,
                }}
              />
            }
            label="YouTube"
            collapsed={collapsed}
            labelRef={addLabelRef}
          />
          <SidebarLink
            href="https://discord.gg/slate"
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
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => createCanvasAction()}
            className="bg-white/20 hidden cursor-pointer pixel text-white rounded-lg px-3 py-2 text-sm"
          >
            New File
          </button>
          <div className="text-sm  mono tracking-tight text-white">
            {firstName} {lastName}&apos;s Workspace
          </div>
          <div className="text-white hidden text-sm pixel px-3 py-2 bg-white/20 rounded-md flex items-center gap-2 flex-wrap">
            Unlock unlimited creation
            <span className="bg-blue-500 px-2 py-1 rounded text-xs">
              Upgrade to Pro
            </span>
          </div>
        </div>
        <CreditsBadge credits={credits} />
      </div>

      <div className="p-3 text-white text-sm pixel bg-white/10 rounded-lg">
        <p className="mb-3">
          Learn how to use the canvas with our step-by-step guides.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 min-w-[200px] h-36 bg-white/10 rounded-lg"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <h2 className="text-white text-lg pixel">My Files</h2>
        <input
          type="text"
          placeholder="Search files..."
          className="bg-white/20 py-1 px-4 font-medium tracking-tight rounded-full text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
        />
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
      <h2 className="text-white text-lg pixel">Recently Deleted</h2>
      <p className="text-white/50 text-xs">
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
        flex items-center h-8 rounded-md text-sm
        text-white/60 hover:text-white hover:bg-white/10 transition-colors
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
