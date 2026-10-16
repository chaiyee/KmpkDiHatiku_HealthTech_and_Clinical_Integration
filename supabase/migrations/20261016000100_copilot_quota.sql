-- Operational request quota only. Patient records still sync as one patient_data JSON row.
create table if not exists public.copilot_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  request_count integer not null check (request_count between 1 and 5)
);
alter table public.copilot_limits enable row level security;
revoke all on public.copilot_limits from anon, authenticated;

create or replace function public.claim_copilot_request()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_period timestamptz := date_trunc('hour', now());
  accepted uuid;
begin
  if owner_id is null then return false; end if;
  insert into public.copilot_limits(user_id, period_start, request_count)
  values(owner_id, current_period, 1)
  on conflict(user_id) do update set
    period_start = excluded.period_start,
    request_count = case when copilot_limits.period_start < current_period then 1 else copilot_limits.request_count + 1 end
  where copilot_limits.period_start < current_period or copilot_limits.request_count < 5
  returning user_id into accepted;
  return accepted is not null;
end;
$$;
revoke all on function public.claim_copilot_request() from public, anon;
grant execute on function public.claim_copilot_request() to authenticated;
