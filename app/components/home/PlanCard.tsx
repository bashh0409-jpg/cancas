// PlanCard.tsx

interface Plan {
  name: string;
  price: string;
  popular: boolean;
  description: string;
  credits: {
    amount: string;
    equivalence: string;
  };
  features: string[];
  isCurrent?: boolean;
  onSelect?: () => void;
  ctaLabel?: string;
}

interface PlanCardProps {
  plan: Plan;
  currency?: string;
  annual?: boolean;
  className?: string;
}

export function PlanCard({
  plan,
  currency = "USD",
  annual = false,
  className = "",
}: PlanCardProps) {
  const {
    name,
    popular,
    price,
    description,
    credits,
    features,
    isCurrent,
    onSelect,
    ctaLabel,
  } = plan;

  return (
    <div
      className={`bg-white/10 backdrop-blur-md border border-white/5 p-6 rounded-lg text-white flex flex-col ${className}`}
    >
      <div className="mb-6">
        <div className="w-full flex justify-between items-start">
          <h1 className="text-2xl capitalize">{name}</h1>

          {popular && (
            <div className="bg-[#F7FFA8]/30 text-[#F7FFA8] rounded p-0.1 px-1 flex items-center gap-1">
              <span className="mono text-[10px]">Most Popular</span>
            </div>
          )}
        </div>

        <p className="text-sm text-white/70 mt-4 leading-snug">{description}</p>
      </div>

      <div className="flex flex-col items-start mb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-5xl tracking-tight">{price}</h2>
          <p className="text-xs text-white/70">
            {/* Show currency code alongside /month when it's not obvious from symbol */}
            {currency !== "USD" ? `${currency} ` : ""}/month
          </p>
        </div>
        {annual && price !== "$0" && (
          <p className="text-[11px] text-white/40 mt-1">
            Billed annually — save 15%
          </p>
        )}
      </div>

      {isCurrent ? (
        <button
          disabled
          className="w-full flex text-xs items-center justify-center gap-2 bg-white/10 text-white/60 py-2 rounded-lg cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : (
        <button
          onClick={onSelect}
          className="w-full cursor-pointer text-xs flex items-center justify-center gap-2 lime text-black h-8 rounded-md"
        >
          {ctaLabel ?? `Upgrade to ${name}`}
        </button>
      )}

      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-2">
          <CreditIcon />
          <div className="text-sm">
            <p className="text-white">{credits.amount}</p>
            <p className="text-white/60 text-xs">{credits.equivalence}</p>
          </div>
        </div>
      </div>

      <hr className="border-white/10 my-5" />

      <div className="flex-1 space-y-3">
        {features.map((text) => (
          <Feature key={text} text={text} />
        ))}
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <CheckIcon />
      <span>{text}</span>
    </div>
  );
}

function CreditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 mt-0.5"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white/70 shrink-0"
    >
      <path
        d="M14.354 4.85403L6.35403 12.854C6.30759 12.9005 6.25245 12.9374 6.19175 12.9626C6.13105 12.9877 6.06599 13.0007 6.00028 13.0007C5.93457 13.0007 5.86951 12.9877 5.80881 12.9626C5.74811 12.9374 5.69296 12.9005 5.64653 12.854L2.14653 9.35403C2.05271 9.26021 2 9.13296 2 9.00028C2 8.8676 2.05271 8.74035 2.14653 8.64653C2.24035 8.55271 2.3676 8.5 2.50028 8.5C2.63296 8.5 2.76021 8.55271 2.85403 8.64653L6.00028 11.7934L13.6465 4.14653C13.7403 4.05271 13.8676 4 14.0003 4C14.133 4 14.2602 4.05271 14.354 4.14653C14.4478 4.24035 14.5006 4.3676 14.5006 4.50028C14.5006 4.63296 14.4478 4.76021 14.354 4.85403Z"
        fill="currentColor"
      />
    </svg>
  );
}
