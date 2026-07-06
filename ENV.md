# Environment Configuration Guide

## Base URLs

| Environment | URL |
|---|---|
| Production | `https://app.swipes.site` |
| Local Dev | `http://localhost:3000` |

---

## 1. Supabase Authentication

**Console URL:** https://supabase.com/dashboard/project/okgjifzweuehbcxrohmh/auth/url-configuration

**Navigation:** Supabase Dashboard → Project → Authentication → URL Configuration

**Site URL:**
```
https://app.swipes.site
```

**Redirect URLs** (add all of these):
```
https://app.swipes.site/api/auth/callback
https://app.swipes.site/auth/callback
http://localhost:3000/api/auth/callback
http://localhost:3000/auth/callback
```

**Where to click:**
1. Go to the console URL above
2. In **"Site URL"** field, enter `https://app.swipes.site`
3. In **"Redirect URLs"** section, click **"Add URL"** for each URL above
4. Click **"Save"**

---

## 2. Google OAuth (Sign-In)

**Console URL:** https://console.cloud.google.com/apis/credentials?project=reflow-ai

**Navigation:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

**Authorized Redirect URIs:**
```
https://app.swipes.site/api/auth/callback
http://localhost:3000/api/auth/callback
```

**Where to click:**
1. Go to the console URL above
2. Click on your OAuth 2.0 Client ID (the one used for "Web application")
3. Under **"Authorized redirect URIs"**, click **"Add URI"**
4. Add each URL above
5. Click **"Save"**

---

## 3. Google Drive Integration

**Console URL:** https://console.cloud.google.com/apis/credentials?project=reflow-ai

**Navigation:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (same app as sign-in, or a separate one)

**Authorized Redirect URI:**
```
https://app.swipes.site/api/integrations/google-drive/callback
http://localhost:3000/api/integrations/google-drive/callback
```

**Where to click:**
1. Go to the console URL above
2. Click on the OAuth 2.0 Client ID used for Google Drive
3. Under **"Authorized redirect URIs"**, click **"Add URI"**
4. Add each URL above
5. Click **"Save"**

---

## 4. Microsoft / Azure OAuth

**Console URL:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/AppRegistrationsBlade

**Navigation:** Azure Portal → App Registrations → Your App → Authentication

**Redirect URI:**
```
https://app.swipes.site/api/auth/callback?next=/home
http://localhost:3000/api/auth/callback?next=/home
```

**Where to click:**
1. Go to the console URL above
2. Click on your app registration
3. In the left menu, click **"Authentication"**
4. Under **"Redirect URIs"**, click **"Add URI"**
5. Add each URL above
6. Click **"Save"**

---

## 5. OneDrive Integration

**Console URL:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/AppRegistrationsBlade

**Navigation:** Azure Portal → App Registrations → Your App → Authentication

**Redirect URI:**
```
https://app.swipes.site/api/integrations/onedrive/callback
http://localhost:3000/api/integrations/onedrive/callback
```

**Where to click:**
1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/AppRegistrationsBlade
2. Click on your app registration (or create a new one)
3. In the left menu, click **"Authentication"**
4. Under **"Redirect URIs"**, click **"Add URI"**
5. Add each URL above
6. Under **"Certificates & secrets"**, create a new client secret and copy the value
7. Under **"API permissions"**, add `Files.Read` (delegated) permission
8. Click **"Save"**

---

## 6. Dropbox Integration

**Console URL:** https://www.dropbox.com/developers/apps

**Navigation:** Dropbox Developer Console → Your App → Permissions

**Redirect URI:**
```
https://app.swipes.site/api/integrations/dropbox/callback
http://localhost:3000/api/integrations/dropbox/callback
```

**Where to click:**
1. Go to https://www.dropbox.com/developers/apps
2. Click on your app (e.g., "Reflow")
3. Under **"OAuth 2"** section, find **"Redirect URIs"**
4. Click **"Add"** and enter `https://app.swipes.site/api/integrations/dropbox/callback`
5. Click **"Add"** again and enter `http://localhost:3000/api/integrations/dropbox/callback`
6. Click **"Save"**


---

## 7. PayFast

**Console URL:** https://www.payfast.co.za/eng/account

**Navigation:** PayFast Dashboard → Settings → Integration

| URL Type | Production URL |
|---|---|
| Return URL | `https://app.swipes.site/billing/success` |
| Cancel URL | `https://app.swipes.site/billing/cancel` |
| Notify URL | `https://app.swipes.site/api/billing/webhooks/payfast` |

**Where to click:**
1. Go to https://www.payfast.co.za/eng/account
2. Log in and go to **"Settings"** → **"Integration"**
3. Under **"Return URL"**, enter `https://app.swipes.site/billing/success`
4. Under **"Cancel URL"**, enter `https://app.swipes.site/billing/cancel`
5. Under **"Notify URL"**, enter `https://app.swipes.site/api/billing/webhooks/payfast`
6. Click **"Save"**


---

## 8. Stripe Webhooks

**Console URL:** https://dashboard.stripe.com/webhooks

**Navigation:** Stripe Dashboard → Developers → Webhooks

**Webhook endpoint:**
```
https://app.swipes.site/api/billing/webhooks/stripe
```

**Where to click:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. In **"Endpoint URL"**, enter `https://app.swipes.site/api/billing/webhooks/stripe`
4. Select events to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`)
5. Click **"Add endpoint"**

---

## Environment Variables Summary

| Variable | Production Value | Dev Value | Where to Configure |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://app.swipes.site` | `http://localhost:3000` | OAuth redirects, billing |
| `NEXT_PUBLIC_SITE_URL` | `https://app.swipes.site` | `http://localhost:3000` | Fallback for app URL |
| `GOOGLE_REDIRECT_URI` | `https://app.swipes.site/api/integrations/google-drive/callback` | `http://localhost:3000/api/integrations/google-drive/callback` | Google Drive OAuth |
| `DROPBOX_REDIRECT_URI` | `https://app.swipes.site/api/integrations/dropbox/callback` | `http://localhost:3000/api/integrations/dropbox/callback` | Dropbox OAuth |
| `ONEDRIVE_REDIRECT_URI` | `https://app.swipes.site/api/integrations/onedrive/callback` | `http://localhost:3000/api/integrations/onedrive/callback` | OneDrive (Azure AD) OAuth |
| `PAYFAST_RETURN_URL` | `https://app.swipes.site/billing/success` | `http://localhost:3000/billing/success` | PayFast dashboard |
| `PAYFAST_CANCEL_URL` | `https://app.swipes.site/billing/cancel` | `http://localhost:3000/billing/cancel` | PayFast dashboard |
| `PAYFAST_NOTIFY_URL` | `https://app.swipes.site/api/billing/webhooks/payfast` | `http://localhost:3000/api/billing/webhooks/payfast` | PayFast dashboard |

---

## Deployment Checklist

When deploying to `app.swipes.site`, update these places:

- [ ] **Supabase Auth** (https://supabase.com/dashboard/project/okgjifzweuehbcxrohmh/auth/url-configuration): Site URL → `https://app.swipes.site`, add redirect URLs
- [ ] **Google Cloud Console** (https://console.cloud.google.com/apis/credentials): add `https://app.swipes.site/api/auth/callback` and `https://app.swipes.site/api/integrations/google-drive/callback`
- [ ] **Azure Portal** (https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/AppRegistrationsBlade): add `https://app.swipes.site/api/auth/callback?next=/home`
- [ ] **Azure Portal** (https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/AppRegistrationsBlade): add `https://app.swipes.site/api/integrations/onedrive/callback` (can be same app or separate)
- [ ] **Dropbox Developer Console** (https://www.dropbox.com/developers/apps): add `https://app.swipes.site/api/integrations/dropbox/callback`
- [ ] **PayFast Dashboard** (https://www.payfast.co.za/eng/account): update Return/Cancel/Notify URLs
- [ ] **Stripe Dashboard** (https://dashboard.stripe.com/webhooks): update webhook endpoint to `https://app.swipes.site/api/billing/webhooks/stripe`
