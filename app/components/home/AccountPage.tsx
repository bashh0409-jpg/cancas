"use client";

import { useState } from "react";
import { ArrowLeft, Settings, User } from "lucide-react";

type AccountTab = "profile" | "settings";

const firstName = "Mitch";
const lastName = "Richters";
const fullName = "Mitch Richters";
const email = "mitch@slate.com";

function ProfileTab() {
  return (
    <div className="flex flex-col gap-8 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-md  lime border border-white/10 flex items-center justify-center shrink-0">
                  <span>{firstName.charAt(0)}</span>
                  
        </div>
        <div>
        </div>
      </div>

      {/* user details */}
          <div className="flex flex-col gap-4">
              <div className="flex flex-col text-white gap-2">
                  <span className="text-white text-xs">Full Name</span>
                  <div className="max-w-80 h-9 bg-[#212529] rounded text-xs mono p-2 flex items-center">{fullName}</div>
              </div>
              <div className="flex flex-col text-white gap-2">
                  <span className="text-white text-xs">Email</span>
                  <div className="max-w-80 h-9 bg-[#212529] rounded text-xs mono p-2 flex items-center">{email}</div>
              </div>
              <div className="flex flex-col text-white gap-2">
                  <span className="text-white text-xs">Role</span>
                  <div className="max-w-80 h-9 bg-[#212529] rounded text-xs mono p-2 flex items-center">Admin</div>
              </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="flex flex-col gap-8 max-w-lg">
      {/* Plan */}
      <Section title="Plan">
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
          <div>
            <p className="text-white text-sm font-medium">Free</p>
            <p className="text-white/40 text-xs mt-0.5">
              Limited canvas creation · 50 credits / mo
            </p>
          </div>
          <button className="text-xs bg-blue-500 hover:bg-blue-400 text-white font-medium px-3 py-1.5 rounded-md transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </Section>

      <div className="h-px bg-white/5" />

      {/* Notifications */}
      <Section title="Notifications">
        <Toggle
          label="Product updates"
          description="New features and announcements"
          defaultChecked
        />
        <Toggle
          label="Canvas activity"
          description="Comments and edits on your canvases"
          defaultChecked
        />
        <Toggle
          label="Marketing emails"
          description="Tips, tutorials and offers"
        />
      </Section>

      <div className="h-px bg-white/5" />

      {/* Danger zone */}
      <Section title="Danger zone">
        <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
          <div>
            <p className="text-white text-sm font-medium">Delete account</p>
            <p className="text-white/40 text-xs mt-0.5">
              Permanently removes all your data.
            </p>
          </div>
          <button className="text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-md transition-colors">
            Delete
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-white/30 text-[11px] uppercase tracking-widest">
        {title}
      </p>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white text-sm">{label}</p>
        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
          on ? "bg-white" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
            on ? "translate-x-4 bg-black" : "bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}

const TABS: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  return (
    // Full bleed inside <main> — centred both axes
    <div className="flex items-start justify-center  min-h-full pt-16 pb-16">
      <div className="flex gap-12">
        {/* Left nav */}
        <a
          href="/home"
          className="text-black items-center flex justify-center rounded h-7 cursor-pointer  w-7 bg-white"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </a>
        <nav className="flex flex-col gap-0.5 w-50 shrink-0 pt-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-2 py-1.5 h-10 rounded-md tracking-tight pixel text-left transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="w-px bg-white/5 self-stretch" />

        {/* Content */}
        <div className="w-[700px]">
          <h1 className="text-white text-base font-medium mb-6">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
