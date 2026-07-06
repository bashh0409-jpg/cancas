# Environment Configuration Guide

## Base URLs

| Environment | URL |
|---|---|
| Production | `https://app.swipes.site` |
| Local Dev | `http://localhost:3000` |

---

## Redirect URLs to Configure in External Services

### 1. Supabase Authentication (Dashboard → Authentication → URL Configuration)

**Redirect URLs** (add all of these to "Redirect URLs" in Supabase):
```
https://app.swipes.site/api/auth/callback
https://app.swipes.site/auth/callback
http://localhost:3000/api/auth/callback
http://localhost:3000/auth/callback
```

**Site URL** (in Supabase Auth settings):
```
https://app.swipes.site
```

---

### 2. Google OAuth (Google Cloud Console → APIs & Services → Credentials)

**Authorized Redirect URIs** (for Google Sign-In):
```
https://app.swipes.site/api/auth/callback
http://localhost:3000/api/auth/callback
```

**Authorized Redirect URIs** (for Google Drive integration):
```
https://app.swipes.site/api/integrations/google-drive/callback
http://localhost:3000/api/integrations/google-drive/callback
```

---

### 3. Microsoft / Azure OAuth (Azure Portal → App Registrations)

**Redirect URI**:
```
https://app.swipes.site/api/auth/callback?next=/home
http://localhost:3000/api/auth/callback?next=/home
```

---

### 4. Dropbox OAuth (Dropbox App Console)

**Redirect URI**:
```
https://app.swipes.site/api/integrations/dropbox/callback
http://localhost:3000/api/integrations/dropbox/callback
```

---

### 5. PayFast (PayFast Dashboard)

**Return URL**: `https://app.swipes.site/billing/success`
**Cancel URL**: `https://app.swipes.site/billing/cancel`
**Notify URL**: `https://app.swipes.site/api/billing/webhooks/payfast`

---

### 6. Stripe Webhooks (Stripe Dashboard → Webhooks)

**Webhook endpoint**: `https://app.swipes.site/api/billing/webhooks/stripe`

---

## Environment Variables Summary

| Variable | Production Value | Dev Value | Where to Configure |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://app.swipes.site` | `http://localhost:3000` | OAuth redirects, billing |
| `NEXT_PUBLIC_SITE_URL` | `https://app.swipes.site` | `http://localhost:3000` | Fallback for app URL |
| `GOOGLE_REDIRECT_URI` | `https://app.swipes.site/api/integrations/google-drive/callback` | `http://localhost:3000/api/integrations/google-drive/callback` | Google Drive OAuth |
| `DROPBOX_REDIRECT_URI` | `https://app.swipes.site/api/integrations/dropbox/callback` | `http://localhost:3000/api/integrations/dropbox/callback` | Dropbox OAuth |
| `PAYFAST_RETURN_URL` | `https://app.swipes.site/billing/success` | `http://localhost:3000/billing/success` | PayFast dashboard |
| `PAYFAST_CANCEL_URL` | `https://app.swipes.site/billing/cancel` | `http://localhost:3000/billing/cancel` | PayFast dashboard |
| `PAYFAST_NOTIFY_URL` | `https://app.swipes.site/api/billing/webhooks/payfast` | `http://localhost:3000/api/billing/webhooks/payfast` | PayFast dashboard |

---

## Deployment Checklist

When deploying to `app.swipes.site`, update these places:

- [ ] Supabase Auth: Site URL → `https://app.swipes.site`
- [ ] Supabase Auth: Redirect URLs → add `https://app.swipes.site/*`
- [ ] Google Cloud Console: add `https://app.swipes.site/api/auth/callback`
- [ ] Google Cloud Console: add `https://app.swipes.site/api/integrations/google-drive/callback`
- [ ] Azure App Registration: add `https://app.swipes.site/api/auth/callback?next=/home`
- [ ] Dropbox App Console: add `https://app.swipes.site/api/integrations/dropbox/callback`
- [ ] PayFast Dashboard: update Return/Cancel/Notify URLs to `https://app.swipes.site/*`
- [ ] Stripe Dashboard: update webhook endpoint to `https://app.swipes.site/api/billing/webhooks/stripe`