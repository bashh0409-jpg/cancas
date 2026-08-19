# Polar Webhook Setup

This guide connects Polar billing events to the Reflow application and Supabase.

The integration uses this flow:

```text
Polar webhook
  -> Next.js POST /api/billing/webhooks/polar
  -> signature verification
  -> Supabase service-role client
  -> user_subscriptions and idempotency_keys
  -> plan credit grant
```

Polar does not connect directly to Supabase. Polar must send events to the deployed Next.js URL.

## 1. Prepare Supabase

Run all pending migrations in the Supabase project used by the application. The webhook requires these tables:

- `public.user_subscriptions`
- `public.idempotency_keys`

From the repository root, review the migration files under `supabase/migrations/`, especially:

- `005_user_subscriptions.sql`
- `009_idempotency_keys.sql`
- `010_billing_reliability.sql`
- `011_decimal_credits.sql`
- `012_canvas_creation_cost.sql`

If the project uses the Supabase CLI:

```bash
supabase db push
```

Confirm in Supabase Dashboard -> Table Editor that `user_subscriptions` and `idempotency_keys` exist.

The application server also needs the Supabase server variables configured:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it to the repository.

## 2. Configure application environment variables

Set these variables in the deployment environment and in `.env.local` for local testing:

```env
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_ENVIRONMENT=production
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
POLAR_WEBHOOK_URL=https://www.swipes.site/api/billing/webhooks/polar
```

Use `POLAR_ENVIRONMENT=sandbox` when testing with Polar sandbox products and credentials.

The webhook secret must match the secret generated for the webhook endpoint in Polar. It is not the Polar API access token.

After changing environment variables, redeploy or restart the Next.js server.

## 3. Create the webhook in Polar

1. Sign in to the Polar dashboard.
2. Select the correct organization.
3. Select the correct environment: sandbox for testing or production for live billing.
4. Open the organization settings and find **Webhooks** or **Webhook endpoints**.
5. Create a new webhook endpoint.
6. Enter the deployed URL:

   ```text
   https://www.swipes.site/api/billing/webhooks/polar
   ```

7. Generate or copy the endpoint signing secret.
8. Save that secret as `POLAR_WEBHOOK_SECRET` in the application deployment environment.
9. Enable the subscription and checkout events needed by the application. At minimum, select:
   - `subscription.created`
   - `subscription.active`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.past_due`
   - `subscription.revoked`
   - `checkout.updated`

10. Save the endpoint and use Polar's **Send test event** or delivery test action if available.

The endpoint must be created separately in sandbox and production if both environments are used. Sandbox events will not be delivered to the production endpoint unless configured that way in Polar.

## 4. Configure products and checkout metadata

The checkout code sends this metadata to Polar:

```json
{
  "userId": "SUPABASE_AUTH_USER_ID",
  "plan": "starter | pro | ultra",
  "billingCycle": "monthly",
  "idempotencyKey": "checkout-key"
}
```

The `userId` value is required. The webhook uses it to locate the user's row in `user_subscriptions`.

Configure monthly recurring prices for each supported plan, using either the per-plan price variables or product IDs:

```env
POLAR_PRICE_STARTER_MONTHLY=price-id
POLAR_PRICE_PRO_MONTHLY=price-id
POLAR_PRICE_ULTRA_MONTHLY=price-id
```

Alternatively configure:

```env
POLAR_PRODUCT_ID_STARTER=product-id
POLAR_PRODUCT_ID_PRO=product-id
POLAR_PRODUCT_ID_ULTRA=product-id
```

The products must have a recurring monthly price. Annual subscriptions are not enabled.

## 5. Test the endpoint locally

Polar cannot deliver to `localhost` directly. Start the application:

```bash
npm run dev
```

Expose port 3000 through a tunnel, for example:

```bash
cloudflared tunnel --url http://localhost:3000
```

Use the HTTPS tunnel URL as the webhook endpoint in Polar:

```text
https://YOUR-TUNNEL-DOMAIN/api/billing/webhooks/polar
```

Keep `POLAR_ENVIRONMENT=sandbox`, use sandbox Polar credentials, and use sandbox products.

Complete a sandbox checkout or send a test event from Polar. Watch the Next.js terminal logs for:

```text
Polar webhook received
```

A successful response looks like:

```json
{
  "received": true,
  "eventId": "..."
}
```

An unsigned request must fail. For example:

```bash
curl -i -X POST http://localhost:3000/api/billing/webhooks/polar \
  -H 'content-type: application/json' \
  --data '{"type":"subscription.active","data":{}}'
```

Expected result when the secret is configured:

```text
401 Invalid signature
```

Do not use a manually crafted request as a successful webhook test because Polar's signature headers are required:

- `webhook-id`
- `webhook-timestamp`
- `webhook-signature`

Polar generates these headers when it sends a real or dashboard test event.

## 6. Verify Supabase updates

After a successful sandbox checkout or subscription event, open Supabase Dashboard -> Table Editor -> `user_subscriptions` and verify the user's row:

- `provider` is `polar`
- `status` is `active`, `canceled`, or `past_due` as appropriate
- `plan` is `starter`, `pro`, or `ultra`
- `billing_cycle` is `monthly`
- `provider_subscription_id` is populated
- `provider_customer_id` is populated when Polar provides it
- `metadata.lastPolarEventType` is populated
- `metadata.lastPolarEventId` is populated

The event should also create an idempotency row in `idempotency_keys` with:

```text
scope = billing.webhook.polar
key = the Polar event ID
```

If Polar retries the same event, the endpoint should respond with:

```json
{
  "received": true,
  "duplicate": true,
  "eventId": "..."
}
```

A duplicate event must not grant the plan credits a second time.

## 7. Production checklist

- [ ] Supabase migrations are applied to the production project.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured only on the server.
- [ ] `POLAR_ACCESS_TOKEN` belongs to the same Polar organization as the products.
- [ ] `POLAR_ENVIRONMENT` matches the Polar endpoint and products.
- [ ] `POLAR_WEBHOOK_SECRET` exactly matches the Polar endpoint secret.
- [ ] Polar endpoint URL is `https://www.swipes.site/api/billing/webhooks/polar`.
- [ ] The endpoint is enabled and has successful recent deliveries.
- [ ] Recurring prices exist for every supported plan and billing cycle.
- [ ] Checkout metadata contains the Supabase auth user's `userId`.
- [ ] A successful event updates `user_subscriptions` in Supabase.
- [ ] A repeated event is reported as a duplicate.

## Troubleshooting

### `500 Webhook secret not configured`

`POLAR_WEBHOOK_SECRET` is missing from the running deployment. Add it to the server environment and redeploy.

### `401 Invalid signature`

The endpoint secret does not match, the request was manually crafted, or the request headers/body were changed by a proxy. Copy the secret from the exact Polar webhook endpoint and test using a Polar delivery.

### `500 Polar webhook failed` after signature verification

Check the server logs and Supabase tables. Common causes are missing migrations, an invalid service-role key, or a missing `user_subscriptions` row for the supplied `userId`.

### Event returns `received: true` but no subscription changes

The route only updates a subscription when it can find a user ID in event metadata, `data`, `customer`, or `external_id`. Verify that the checkout was created by this application and that its metadata contains `userId`.

### Credits are not granted

Credits are granted only when the event resolves to an active status and includes a supported plan. Verify `metadata.plan` and `metadata.billingCycle` in the Polar event and confirm the matching credit configuration exists in the application.
