import { NextResponse } from "next/server";

const BASE_PRICES_USD = { Free: 0, Starter: 10, Pro: 25, Ultra: 50 };

// Maps country code → ISO 4217 currency code
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  EU: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  ZA: "ZAR",
  NG: "NGN",
  KE: "KES",
  GH: "GHS",
  IN: "INR",
  AU: "AUD",
  CA: "CAD",
  BR: "BRL",
  MX: "MXN",
  JP: "JPY",
  CN: "CNY",
  SG: "SGD",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
  PK: "PKR",
  // add more as needed
};

export async function GET(req: Request) {
  try {
    // Cloudflare sets this header automatically; fall back to IP geo
    const cfCountry = req.headers.get("cf-ipcountry");
    const acceptLang = req.headers.get("accept-language") ?? "";

    let countryCode = cfCountry?.toUpperCase() ?? null;

    // If no Cloudflare header, use a free IP geo API
    if (!countryCode) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/country/`, {
          // short cache so we don't hammer the free tier
          next: { revalidate: 3600 },
        });
        countryCode = (await geoRes.text()).trim().toUpperCase();
      } catch {
        // Fall back on the browser locale if geo lookup fails.
        const locale = acceptLang.split(",")[0]?.trim();
        const localeParts = locale.split("-");
        countryCode = localeParts[1]?.toUpperCase() ?? null;
      }
    }

    const currency = COUNTRY_CURRENCY_MAP[countryCode ?? ""] ?? "USD";

    // Free tier: 1,500 req/month — enough for this use case
    const rateRes = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`,
      { next: { revalidate: 3600 } }, // cache for 1 hour
    );

    if (!rateRes.ok) throw new Error("Exchange rate fetch failed");

    const rateData = await rateRes.json();
    const rate: number = rateData.rates[currency] ?? 1;

    return NextResponse.json({
      currency,
      rate,
      countryCode,
    });
  } catch (err) {
    // Fail gracefully — always return USD so the UI never breaks
    return NextResponse.json({ currency: "USD", rate: 1, countryCode: "US" });
  }
}
