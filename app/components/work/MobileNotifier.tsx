"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { User} from "lucide-react";
import { siDiscord, siYoutube } from "simple-icons";
import { AccountCard } from "../work/HomeShell";
//import Notice from "./Notice";
import {
  type SubscriptionPlan,
  getPlanDetails,
} from "@/lib/subscriptions/repository";

type Props = {
  fullName?: string;
  email?: string;
  photoUrl?: string;
  credits: number;
  plan: SubscriptionPlan;
  signOut: () => void;
  setActivePage: (page: string) => void;
};

const MobileNotifier: React.FC<Props> = ({
  fullName,
  email,
  photoUrl,
  credits,
  plan,
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
      <div className="flex  items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="flex ">
          <Image
            src="/images/Reflow.svg"
            alt="Logo"
            width={64}
            height={34}
            className="object-contain shrink-0"
          />
          <span className="mono text-xs text-white/60 ml-2">BETA</span>
        </div>

        {/* Account button */}
        <button
          onClick={() => setAccountOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm cursor-pointer text-white/70  hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  width={20}
                  height={20}
                  alt={firstName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-white" />
              )}
            </div>

            <span className="whitespace-nowrap hidden text-sm">
              {displayName}
            </span>
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
            plan={plan}
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
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-">
        <p className="text-sm font-normal tracking-tight mono uppercase max-w-90 text-white/90">
          This application is best viewed on a larger screen.
        </p>
        <p className="text-xs tracking-tight font-normal mono uppercase max-w-90 mt-1 text-white/60">
          Please use a desktop or tablet to access all features.
        </p>
      </div>

      <div className="w-full flex flex-col mb-8 justify-center items-center gap-2">
        <span className="text-white mono uppercase  tracking-tight text-[10px] text-center">
          For now you can...
        </span>
        <a
          href="https://youtube.com/@reflowfyi?si=QCnvJcY09fYOThJi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Youtube"
          className="flex lime cursor-pointer h-8 w-full max-w-[80vw] text-black text-xs px-3 mono uppercase tracking-tight items-center flex rounded items-center gap-2"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-current"
            strokeWidth={0.4}
          >
            <path d={siYoutube.path} />
          </svg>
          Watch tutorials on Youtube
        </a>{" "}
        <a
          href="https://discord.gg/vfstVqF3gk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join Discord"
          className="lime h-8 w-full cursor-pointer max-w-[80vw] text-black text-xs px-3 mono uppercase tracking-tight items-center flex rounded  flex items-center gap-2"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-current"
            strokeWidth={0.4}
          >
            <path d={siDiscord.path} />
          </svg>
          Join our Discord community
        </a>{" "}
      </div>
      { /* <div className="w-full absolute bottom-0 left-0">
        <Notice />
      </div> */ }
    </div>
  );
};

export default MobileNotifier;
