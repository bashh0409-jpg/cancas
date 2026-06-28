"use client";

import React, { useState, useMemo } from "react";
import { User, ChevronDown } from "lucide-react";
import { siDiscord, siInstagram, siYoutube } from "simple-icons";
import { AccountCard } from "../home/HomeShell";

type Props = {
  fullName?: string;
  email?: string;
  photoUrl?: string;
  credits: number;
  signOut: () => void;
  setActivePage: (page: string) => void;
};

const MobileNotifier: React.FC<Props> = ({
  fullName,
  email,
  photoUrl,
  credits,
  signOut,
  setActivePage,
}) => {
  const [accountOpen, setAccountOpen] = useState(false);

  const { firstName, lastName } = useMemo(() => {
    const base = fullName || email?.split("@")[0] || "User";

    const parts = base.split(" ");

    return {
      firstName: parts[0],
      lastName: parts[1] ?? "",
    };
  }, [fullName, email]);

  const displayName = fullName || email?.split("@")[0] || "User";

  return (
    <div className="relative w-full h-screen md:hidden bg-black text-white flex flex-col">
      {/* Top bar with logo and account */}
      <div className="flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <img
          src="/images/Re.svg"
          alt="Logo"
          width={34}
          height={24}
          className="object-contain shrink-0"
        />

        {/* Account button */}
        <button
          onClick={() => setAccountOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={firstName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-white" />
              )}
            </div>

            <span className="whitespace-nowrap hidden text-sm">{displayName}</span>
          </div>
        </button>
      </div>

      {/* Account popup */}
      {accountOpen && (
        <div className="relative z-50">
          <AccountCard
            firstName={firstName}
            lastName={lastName}
            credits={credits}
            photoUrl={photoUrl}
            onClose={() => setAccountOpen(false)}
            onSettings={() => {
              setActivePage("account");
              setAccountOpen(false);
            }}
            onSignOut={() => signOut()}
          />
        </div>
      )}

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
        <p className="text-xs font-normal mono max-w-sm text-white/60">
          This page is best viewed on a larger screen. Please visit on a desktop
          or tablet to access all features.
        </p>
      </div>

      {/* Bottom social links */}
      <div className="flex items-center justify-center gap-6 px-4 py-6">
        <a
          href="https://www.instagram.com/reflowfyi?igsh=MXRlamY1MHE1ZmxmNA%3D%3D&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/80 transition-colors"
          aria-label="Instagram"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
          >
            <path d={siInstagram.path} />
          </svg>
        </a>
        <a
          href="https://youtube.com/@reflowfyi?si=QCnvJcY09fYOThJi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/80 transition-colors"
          aria-label="YouTube"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
          >
            <path d={siYoutube.path} />
          </svg>
        </a>
        <a
          href="https://discord.gg/xexnRhqBP"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/80 transition-colors"
          aria-label="Discord"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
          >
            <path d={siDiscord.path} />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default MobileNotifier;