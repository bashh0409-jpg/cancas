export default function CanvasLoading() {
  return (
    <main
      aria-label="Loading canvas"
      aria-live="polite"
      className="grid h-screen w-full place-items-center bg-black"
      role="status"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </main>
  );
}
