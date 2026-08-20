# Production Domain Configuration

The canonical production origin is `https://www.swipes.site`. Do not use
`app.swipes.site`; the application redirects it to the canonical host.

## Application environment variables

```env
NEXT_PUBLIC_APP_URL=https://www.swipes.site
NEXT_PUBLIC_SITE_URL=https://www.swipes.site
GOOGLE_REDIRECT_URI=https://www.swipes.site/api/integrations/google-drive/callback
DROPBOX_REDIRECT_URI=https://www.swipes.site/api/integrations/dropbox/callback
ONEDRIVE_REDIRECT_URI=https://www.swipes.site/api/integrations/onedrive/callback
POLAR_CHECKOUT_URL=https://www.swipes.site/billing/checkout
POLAR_SUCCESS_URL=https://www.swipes.site/billing/success
POLAR_CANCEL_URL=https://www.swipes.site/billing/cancel
POLAR_WEBHOOK_URL=https://www.swipes.site/api/billing/webhooks/polar
POLAR_ACCESS_TOKEN=your-production-polar-access-token
POLAR_ENVIRONMENT=production
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
REMOVE_BACKGROUND_KEY=your-remove-bg-api-key
TOPAZ_API_KEY=your-topaz-api-key
```

`REMOVE_BACKGROUND_KEY` is the remove.bg API key used by
`/api/ai/remove-background`. Without it the Remove Background action returns
`503 Remove background is not configured`.

`TOPAZ_API_KEY` is the Topaz Labs API key used by `/api/ai/upscale`
(Gigapixel image enhancement). `TOPAZ_IMAGE_MODEL` selects the upsample
model (default: `Low Resolution V2`). Without these, the Upscale action on
the image context menu returns `503 Topaz upscale is not configured`.

Keep the local-development values in `.env.local` pointed at
`http://localhost:3000`.

## Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to `https://www.swipes.site`.
- Add `https://www.swipes.site/api/auth/callback` to **Redirect URLs**.
- Keep `http://localhost:3000/api/auth/callback` for local development.
- Remove all `app.swipes.site` entries after production is confirmed working.

## OAuth providers

Update each provider to use these exact production callback URLs:

| Provider       | Callback URL                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google sign-in | `https://www.swipes.site/api/auth/callback`                                                                                                         |
| Azure sign-in  | `https://www.swipes.site/api/auth/callback?next=/work`                                                                                              |
| Figma sign-in  | `https://www.swipes.site/api/auth/callback?next=/work` (add to Supabase's Redirect URLs allow list as `https://www.swipes.site/api/auth/callback*`) |
| Google Drive   | `https://www.swipes.site/api/integrations/google-drive/callback`                                                                                    |
| OneDrive       | `https://www.swipes.site/api/integrations/onedrive/callback`                                                                                        |
| Dropbox        | `https://www.swipes.site/api/integrations/dropbox/callback`                                                                                         |

### Figma OAuth Setup

Figma is a **native Supabase OAuth provider**. Configure it entirely in the Supabase dashboard:

1. Go to **Supabase Dashboard → Authentication → Providers → Figma** and enable it.
2. Go to [Figma Developer Settings](https://www.figma.com/developers/apps) and create a new OAuth app.
3. In the Figma OAuth app config, set the **Redirect URI** to Supabase's auth callback:
   ```
   https://okgjifzweuehbcxrohmh.supabase.co/auth/v1/callback
   ```
   ⚠️ This is Supabase's endpoint, **not** your app's domain. Figma sends the auth code here, and Supabase handles the exchange.
4. Copy the **Client ID** and **Client Secret** from Figma into the Supabase provider settings.
5. No environment variables or custom API routes are needed — the flow uses the same pattern as Google and Azure.
6. In **Supabase Dashboard → Authentication → URL Configuration**, make sure the **Redirect URLs allow list** includes
   `https://www.swipes.site/api/auth/callback*` (and `http://localhost:3000/api/auth/callback*` for local dev). The
   trailing `*` wildcard is required because the app's `redirectTo` includes a `?next=/work` query string — without it,
   Supabase silently falls back to the project's **Site URL** and the user lands on the bare domain instead of `/work`.
   Remove any stale `.../api/auth/figma/callback` entry from the allow list; that route does not exist in this app.

## Billing endpoints

- Polar checkout success URL: `https://www.swipes.site/billing/success`
- Polar checkout cancel URL: `https://www.swipes.site/billing/cancel`
- Polar webhook: `https://www.swipes.site/api/billing/webhooks/polar`
- Polar webhook secret: set `POLAR_WEBHOOK_SECRET` to the signing secret from the Polar webhook endpoint configuration.

## Deployment checklist

1. Attach `www.swipes.site` to the production deployment and set it as the primary domain.
2. Redirect `swipes.site` to `www.swipes.site` at the hosting/DNS layer.
3. Set the production environment variables above, then redeploy.
4. Update Supabase, Google, Azure, Dropbox, and Polar with the listed URLs.
