export function formatCredits(credits: number) {
  return Number.isFinite(credits) ? credits.toFixed(2) : "0.00";
}
