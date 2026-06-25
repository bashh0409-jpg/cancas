-- Billing reliability: lock down client-side writes and speed up webhook lookups.
-- Safe to re-run.

create index if not exists user_subscriptions_provider_subscription_id_idx
  on public.user_subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;

drop policy if exists "Users can insert their own subscription" on public.user_subscriptions;
drop policy if exists "Users can update their own subscription" on public.user_subscriptions;
drop policy if exists "Users can delete their own subscription" on public.user_subscriptions;

drop policy if exists "Users can update their own credits" on public.user_credits;
