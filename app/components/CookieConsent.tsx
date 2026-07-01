"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type ConsentChoice = "accepted" | "rejected" | "customized";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

interface ConsentRecord {
  choice: ConsentChoice;
  timestamp: number;
  preferences?: CookiePreferences;
}

const STORAGE_KEY = "reflow:cookie-consent";
const EXPIRY_DAYS = 30;

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  preferences: false,
  marketing: false,
};

function getConsentRecord(): ConsentRecord | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as ConsentRecord;
    if (!parsed.choice || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isExpired(timestamp: number): boolean {
  const elapsed = Date.now() - timestamp;
  return elapsed > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<"banner" | "customize">("banner");
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const record = getConsentRecord();
    if (!record || isExpired(record.timestamp)) {
      setVisible(true);
    }
  }, []);

  const saveRecord = (choice: ConsentChoice, prefs?: CookiePreferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, timestamp: Date.now(), preferences: prefs }),
      );
    } catch {
      // Storage unavailable
    }
    setVisible(false);
    setView("banner");
  };

  const handleAccept = () =>
    saveRecord("accepted", {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });

  const handleReject = () => saveRecord("rejected");

  const handleSaveCustom = () => saveRecord("customized", preferences);

  const switchView = (to: "banner" | "customize") => {
    if (!panelRef.current) return;

    gsap.to(panelRef.current, {
      scaleY: 0,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      transformOrigin: "bottom center",
      onComplete: () => {
        setView(to);
        gsap.fromTo(
          panelRef.current,
          { scaleY: 0, opacity: 0 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.1,
            ease: "power2.out",
            transformOrigin: "bottom center",
          },
        );
      },
    });
  };

 if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div
        ref={panelRef}
        className="rounded border border-white/10 bg-white px-4 shadow-2xl backdrop-blur-md"
      >
        {view === "banner" && (
          <div className="flex flex-col items-start gap-3 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] mono tracking-tight uppercase text-black/70 leading-relaxed">
                We use cookies to ensure the site works properly, improve your
                experience, and analyze traffic. You can accept all cookies, reject
                non-essential cookies, or customize your preferences at any time.
              </p>
            </div>
            <div className="flex uppercase gap-1">
              <button
                onClick={handleAccept}
                className="shrink-0 rounded  cursor-pointer uppercase bg-black px-3 py-1.5 text-[11px] mono text-white transition hover:bg-black/70"
              >
                Accept
              </button>
              <button
                onClick={handleReject}
                className="shrink-0 rounded  cursor-pointer uppercase bg-black/20 px-3 py-1.5 text-[11px] mono text-black transition hover:bg-black/40"
              >
                Reject
              </button>
              <button
                onClick={() => switchView("customize")}
                className="shrink-0 rounded  cursor-pointer uppercase bg-black/10 px-3 py-1.5 text-[11px] mono text-black/60 transition hover:bg-black/30"
              >
                Customize
              </button>
            </div>
          </div>
        )}

        {view === "customize" && (
          <div className="flex flex-col gap-3 py-4">
            <p className="text-[11px] mono tracking-tight uppercase text-black/70">
              Cookie Preferences
            </p>

            <ToggleRow
              id="essential"
              label="Essential"
              description="Required for the site to function"
              checked={preferences.essential}
              disabled
            />
            <ToggleRow
              id="analytics"
              label="Analytics"
              description="Help us improve with usage data"
              checked={preferences.analytics}
              onChange={(v) => setPreferences((p) => ({ ...p, analytics: v }))}
            />
            <ToggleRow
              id="preferences"
              label="Preferences"
              description="Remember your settings"
              checked={preferences.preferences}
              onChange={(v) => setPreferences((p) => ({ ...p, preferences: v }))}
            />
            <ToggleRow
              id="marketing"
              label="Marketing"
              description="Personalized content and ads"
              checked={preferences.marketing}
              onChange={(v) => setPreferences((p) => ({ ...p, marketing: v }))}
            />

            <div className="flex uppercase gap-1 pt-1">
              <button
                onClick={handleSaveCustom}
                className="shrink-0 rounded cursor-pointer  uppercase bg-black px-3 py-1.5 text-xs mono font-medium text-white transition hover:bg-black/70"
              >
                Save Preferences
              </button>
              <button
                onClick={() => switchView("banner")}
                className="shrink-0 rounded cursor-pointer  uppercase bg-black/10 px-3 py-1.5 text-xs mono font-medium text-black/60 transition hover:bg-black/30"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="text-xs mono uppercase tracking-tight text-black"
        >
          {label}
        </label>
        <p className="text-[10px] mono uppercase tracking-tight text-black/40">
          {description}
        </p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${checked ? "bg-black" : "bg-black/15"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}