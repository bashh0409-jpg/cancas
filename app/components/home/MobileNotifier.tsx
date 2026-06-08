"use client";

import React, { useState, useMemo } from "react";
import { User, ChevronDown } from "lucide-react";
import { AccountCard } from "../home/HomeShell";

type Props = {
  fullName?: string;
  email?: string;
  credits: number;
  signOut: (formData: FormData) => void;
  setActivePage: (page: string) => void;
};

const MobileNotifier: React.FC<Props> = ({
  fullName,
  email,
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
    <div className="relative w-full h-screen md:hidden bg-black text-white px-4">
      {/* Account button - top left */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setAccountOpen((o) => !o)}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>

            <span className="whitespace-nowrap text-sm">{displayName}</span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              accountOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Account popup */}
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

      {/* Center text */}
      <div className="h-full w-full flex items-center justify-center text-center">
        <p className="text-xs font-normal mono max-w-sm">
          You caught us! This page is not available on mobile devices yet.
          Please visit our website on a desktop to access all features. We
          apologize for the inconvenience and appreciate your understanding as
          we work to bring a full experience to all platforms soon.
        </p>
      </div>
    </div>
  );
};

export default MobileNotifier;
