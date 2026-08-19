import { NextResponse } from "next/server";

const BASE_PRICES_USD = { Free: 0, Starter: 15, Pro: 35, Ultra: 65 };

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
    const requestedCountry = new URL(req.url).searchParams
      .get("country")
      ?.toUpperCase() ?? null;
    // Cloudflare and Vercel provide the country without an external lookup.
    const edgeCountry =
      req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
    const acceptLang = req.headers.get("accept-language") ?? "";

    const isSupportedCountry = (value: string | null): value is string =>
      Boolean(value && COUNTRY_CURRENCY_MAP[value]);

    let countryCode = isSupportedCountry(requestedCountry)
      ? requestedCountry
      : edgeCountry?.toUpperCase() ?? null;

    // In development, the browser locale is more reliable than localhost IP geo.
    if (!isSupportedCountry(countryCode)) {
      const locale = acceptLang.split(",")[0]?.trim();
      const localeCountry = locale.split("-")[1]?.toUpperCase() ?? null;
      countryCode = isSupportedCountry(localeCountry) ? localeCountry : null;
    }

    // If no edge or locale country exists, use a free IP geo API.
    if (!countryCode) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      if (ip) {
        try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/country/`, {
          // short cache so we don't hammer the free tier
          next: { revalidate: 3600 },
        });
          const geoCountry = (await geoRes.text()).trim().toUpperCase();
          countryCode = isSupportedCountry(geoCountry) ? geoCountry : null;
        } catch {
          countryCode = null;
        }
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
      countryCode: countryCode ?? "US",
    });
  } catch (err) {
    // Fail gracefully — always return USD so the UI never breaks
    return NextResponse.json({ currency: "USD", rate: 1, countryCode: "US" });
  }
}
