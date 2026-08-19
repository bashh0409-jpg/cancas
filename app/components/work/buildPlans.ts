// app/components/work/buildPlans.ts

type CurrencyData = {
  currency: string;
  rate: number;
};

export type PricingPlan = {
  name: string;
  description: string;
  monthlyCredits: number;
  price: number;
  highlighted?: boolean;
};

export function buildPlans(currencyData: CurrencyData): PricingPlan[] {
  const convertPrice = (usd: number) => Math.round(usd * currencyData.rate);

  return [
    {
      name: "Starter",
      description: "For casual creative workflows",
      monthlyCredits: 1000,
      price: convertPrice(10),
    },
    {
      name: "Pro",
      description: "For advanced creators and teams",
      monthlyCredits: 2500,
      price: convertPrice(25),
      highlighted: true,
    },
    {
      name: "Ultra",
      description: "Maximum power and scale",
      monthlyCredits: 5000,
      price: convertPrice(50),
    },
  ];
}
