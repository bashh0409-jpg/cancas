# Cloudflare Security Setup

Use this when placing CanvasAI behind Cloudflare. The app now sends origin
headers that keep private routes out of cache and includes a lightweight
origin-side API rate-limit fallback, but the main DDoS, bot, CAPTCHA/challenge,
and edge caching controls must be enabled in Cloudflare.

## DNS And Proxy

1. Add the production domain to Cloudflare.
2. Change the domain nameservers at the registrar to the Cloudflare nameservers.
3. In Cloudflare DNS, keep the app hostname proxied with the orange cloud.
4. Set SSL/TLS mode to `Full (strict)` after the origin has a valid certificate.

## DDoS And WAF

Enable:

- Security > WAF > Managed rules: enable the Cloudflare Managed Ruleset.
- Security > Settings: keep Security Level at `Medium` for normal operation.
- Quick Actions > Under Attack Mode: use only during active layer 7 attacks.

Suggested custom WAF rules:

```text
Name: Challenge suspicious API traffic
Expression:
(starts_with(http.request.uri.path, "/api/") and not cf.client.bot and cf.threat_score gt 10)
Action: Managed Challenge
```

```text
Name: Block obvious bad paths
Expression:
(http.request.uri.path contains "/wp-admin" or
 http.request.uri.path contains "/xmlrpc.php" or
 http.request.uri.path contains "/.env" or
 http.request.uri.path contains "/phpmyadmin")
Action: Block
```

## Bot Filtering

For Free plans:

- Security > Bots > Bot Fight Mode: `On`.

For Pro/Business plans:

- Prefer Super Bot Fight Mode if you need exceptions for OAuth callbacks,
  uptime monitoring, webhook providers, or trusted API clients.
- Do not challenge these paths unless you have tested the full flow:
  `/api/billing/webhooks/*`, `/api/auth/callback`, `/api/integrations/*/callback`.

## Rate Limiting Rules

Create Cloudflare WAF rate limiting rules in this order.

```text
Name: AI API burst control
Expression:
starts_with(http.request.uri.path, "/api/ai")
Characteristics: IP
Period: 60 seconds
Requests: 20
Mitigation timeout: 60 seconds
Action: Managed Challenge
```

```text
Name: Credit and checkout abuse control
Expression:
(starts_with(http.request.uri.path, "/api/credits") or
 starts_with(http.request.uri.path, "/api/billing/checkout"))
Characteristics: IP
Period: 60 seconds
Requests: 30
Mitigation timeout: 60 seconds
Action: Managed Challenge 
```


```text
Name: General API abuse control
Expression:
starts_with(http.request.uri.path, "/api/") and
not starts_with(http.request.uri.path, "/api/billing/webhooks") and
not http.request.uri.path in {"/api/auth/callback"}
Characteristics: IP
Period: 60 seconds
Requests: 120
Mitigation timeout: 60 seconds
Action: Managed Challenge
```

## Cache Rules

Keep dynamic and authenticated data private:

```text
Name: Bypass private app and API routes
Expression:
starts_with(http.request.uri.path, "/api/") or
starts_with(http.request.uri.path, "/home") or
starts_with(http.request.uri.path, "/canvas")
Action: Bypass cache
```

Cache safe static assets:

```text
Name: Cache Next static assets
Expression:
starts_with(http.request.uri.path, "/_next/static/") or
starts_with(http.request.uri.path, "/ingest/static/")
Action: Eligible for cache
Edge TTL: Respect origin, or override to 1 month for /_next/static/
Browser TTL: Respect origin
```

Avoid a blanket `Cache Everything` rule for this app. Canvas and account pages
are user-specific and should not be cached by Cloudflare.

## Origin Hardening

After the Cloudflare proxy is live:

1. Restrict direct origin traffic to Cloudflare IP ranges at the hosting
   firewall if your host supports it.
2. Rotate exposed credentials if the origin was public before Cloudflare.
3. Confirm all production URLs use HTTPS.
4. Test OAuth, Stripe/Payfast webhooks, Google Drive, Dropbox, and AI requests
   after bot/challenge rules are enabled.

## Verification

Run these against production:

```bash
curl -I https://YOUR_DOMAIN/_next/static/
curl -I https://YOUR_DOMAIN/api/integrations/status
```

Expected:

- Static responses show Cloudflare headers such as `cf-cache-status`.
- API responses include `cache-control: private, no-store, max-age=0`.
- Repeated API calls eventually return `429` from the origin fallback or a
  Cloudflare challenge/rate-limit response at the edge.
