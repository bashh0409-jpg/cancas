"use client";

import { useState } from "react";

type BillingCycle = "monthly" | "annually";

interface BillingToggleProps {
  value?: BillingCycle;
  onChange?: (cycle: BillingCycle) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const selectedCycle = value ?? cycle;

  const handleSelect = (selected: BillingCycle) => {
    if (onChange) {
      onChange(selected);
    } else {
      setCycle(selected);
    }
  };

  return (
    <div className="mt-6 relative flex items-center bg-white/20 w-fit p-1 rounded-lg overflow-hidden">
      {/* sliding pill — CSS transition instead of GSAP since this is a server component context */}
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-6px)] rounded-md lime transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform:
            selectedCycle === "annually"
              ? "translateX(calc(100% + 4px))"
              : "translateX(0)",
          left: "4px",
        }}
      />

      <button
        onClick={() => handleSelect("monthly")}
        className="relative z-10 h-8 min-w-[120px] flex items-center justify-center px-3 rounded-md text-sm transition-colors duration-300"
        style={{ color: selectedCycle === "monthly" ? "#000" : "#fff" }}
      >
        Monthly
      </button>

      <button
        onClick={() => handleSelect("annually")}
        className="relative z-10 h-8 min-w-[120px] flex items-center justify-center px-3 rounded-md text-sm transition-colors duration-300"
        style={{ color: selectedCycle === "annually" ? "#000" : "#fff" }}
      >
        Annually <span className="ml-1">-15%</span>
      </button>
    </div>
  );
}

export type { BillingCycle };
