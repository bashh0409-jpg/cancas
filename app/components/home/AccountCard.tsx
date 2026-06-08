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
