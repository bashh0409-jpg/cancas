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
```

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

| Provider       | Callback URL                                                     |
| -------------- | ---------------------------------------------------------------- |
| Google sign-in | `https://www.swipes.site/api/auth/callback`                      |
| Azure sign-in  | `https://www.swipes.site/api/auth/callback?next=/home`           |
| Google Drive   | `https://www.swipes.site/api/integrations/google-drive/callback` |
| OneDrive       | `https://www.swipes.site/api/integrations/onedrive/callback`     |
| Dropbox        | `https://www.swipes.site/api/integrations/dropbox/callback`      |

## Billing endpoints

- Polar checkout success URL: `https://www.swipes.site/billing/success`
- Polar checkout cancel URL: `https://www.swipes.site/billing/cancel`
- Polar webhook: `https://www.swipes.site/api/billing/webhooks/polar`

## Deployment checklist

1. Attach `www.swipes.site` to the production deployment and set it as the primary domain.
2. Redirect `swipes.site` to `www.swipes.site` at the hosting/DNS layer.
3. Set the production environment variables above, then redeploy.
4. Update Supabase, Google, Azure, Dropbox, and Polar with the listed URLs.
5. Remove `app.swipes.site` from the deployment domains once its redirect period is no longer needed.
