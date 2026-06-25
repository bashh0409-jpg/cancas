import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Glitch-like 404 */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-[120px] font-bold leading-none tracking-tighter text-white/20 select-none">
          404
        </span>

      </div>

      <h1 className="text-lg mono uppercase tracking-tight text-white/60 mb-3">
        Page not found
      </h1>

      <p className="text-sm tracking-tight text-white/40 mono text-center max-w-md mb-10 leading-relaxed">
        This page doesn&apos;t exist or has been moved.
        <br />
        Try heading back to the home page.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-white/80 mono uppercase tracking-wider"
      >

        Back to home
      </Link>

      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </div>
  );
}