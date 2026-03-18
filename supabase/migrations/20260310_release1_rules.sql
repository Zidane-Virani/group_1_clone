create extension if not exists pgcrypto;

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint auctions_timeframe_check check (end_time > start_time)
);

alter table public.profiles
  add column if not exists kogbucks_balance integer not null default 0;

alter table public.profiles
  add column if not exists role text not null default 'REP';

alter table public.profiles
  add column if not exists name text not null default '';

alter table public.items
  add column if not exists auction_id uuid,
  add column if not exists image_url text,
  add column if not exists starting_bid integer not null default 0,
  add column if not exists current_bid integer not null default 0,
  add column if not exists current_bidder_id uuid,
  add column if not exists winner_id uuid,
  add column if not exists status text not null default 'ACTIVE';

update public.items
set starting_bid = coalesce(starting_bid, starting_price, 0),
    current_bid = coalesce(current_bid, starting_bid, starting_price, 0)
where true;

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now(),
  constraint bids_amount_check check (amount >= 0)
);

create index if not exists bids_item_created_idx on public.bids (item_id, created_at desc);
create index if not exists items_auction_idx on public.items (auction_id);
create unique index if not exists items_single_win_per_user_per_auction
  on public.items (auction_id, winner_id)
  where winner_id is not null;

alter table public.items
  drop constraint if exists items_auction_fk;

alter table public.items
  add constraint items_auction_fk
  foreign key (auction_id) references public.auctions(id) on delete cascade;

alter table public.items
  drop constraint if exists items_current_bidder_fk;

alter table public.items
  add constraint items_current_bidder_fk
  foreign key (current_bidder_id) references public.profiles(id) on delete set null;

alter table public.items
  drop constraint if exists items_winner_fk;

alter table public.items
  add constraint items_winner_fk
  foreign key (winner_id) references public.profiles(id) on delete set null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists auctions_touch_updated_at on public.auctions;
create trigger auctions_touch_updated_at
before update on public.auctions
for each row execute function public.touch_updated_at();

create or replace function public.place_full_balance_bid(
  p_auction_id uuid,
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_role text;
  v_item public.items%rowtype;
  v_auction public.auctions%rowtype;
  v_conflict_item_id uuid;
  v_bid_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to place a bid';
  end if;

  select * into v_auction
  from public.auctions
  where id = p_auction_id;

  if not found then
    raise exception 'Auction not found';
  end if;

  if lower(v_auction.status) <> 'active'
     or now() < v_auction.start_time
     or now() > v_auction.end_time then
    raise exception 'The selected auction is not currently live';
  end if;

  select * into v_item
  from public.items
  where id = p_item_id
    and auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Item not found in the selected auction';
  end if;

  if lower(coalesce(v_item.status, 'active')) <> 'active' then
    raise exception 'This item is not accepting bids';
  end if;

  if v_item.current_bidder_id is null
     and now() > v_auction.start_time + interval '30 minutes' then
    raise exception 'Initial bids must be placed within the first 30 minutes of the auction';
  end if;

  select kogbucks_balance, role
  into v_balance, v_role
  from public.profiles
  where id = v_user_id;

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

  if exists (
    select 1
    from public.items
    where auction_id = p_auction_id
      and winner_id = v_user_id
  ) then
    raise exception 'You already won an item in this auction';
  end if;

  select id into v_conflict_item_id
  from public.items
  where auction_id = p_auction_id
    and current_bidder_id = v_user_id
    and id <> p_item_id
    and lower(coalesce(status, 'active')) = 'active'
  limit 1;

  if v_conflict_item_id is not null then
    raise exception 'You already have an active bid on another item';
  end if;

  if v_item.current_bidder_id = v_user_id then
    raise exception 'You are already the highest bidder on this item';
  end if;

  if v_balance <= coalesce(v_item.current_bid, v_item.starting_bid, 0) then
    raise exception 'Your full Kogbucks balance must beat the current bid';
  end if;

  insert into public.bids (auction_id, item_id, bidder_id, amount)
  values (p_auction_id, p_item_id, v_user_id, v_balance)
  returning id into v_bid_id;

  update public.items
  set current_bid = v_balance,
      current_bidder_id = v_user_id
  where id = p_item_id;

  return jsonb_build_object(
    'bid_id', v_bid_id,
    'item_id', p_item_id,
    'auction_id', p_auction_id,
    'amount', v_balance,
    'bidder_id', v_user_id
  );
end;
$$;

grant execute on function public.place_full_balance_bid(uuid, uuid) to authenticated;

create or replace function public.finalize_auction(p_auction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_result record;
  v_total integer := 0;
begin
  select role into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null or upper(v_role) not like '%ADMIN%' then
    raise exception 'Only administrators can finalize auctions';
  end if;

  for v_result in
    select id, current_bidder_id, current_bid
    from public.items
    where auction_id = p_auction_id
      and current_bidder_id is not null
      and winner_id is null
  loop
    update public.items
    set winner_id = v_result.current_bidder_id,
        status = 'SOLD'
    where id = v_result.id;

    update public.profiles
    set kogbucks_balance = greatest(kogbucks_balance - v_result.current_bid, 0)
    where id = v_result.current_bidder_id;

    v_total := v_total + 1;
  end loop;

  update public.auctions
  set status = 'CLOSED'
  where id = p_auction_id;

  return jsonb_build_object(
    'auction_id', p_auction_id,
    'items_finalized', v_total,
    'status', 'CLOSED'
  );
end;
$$;

grant execute on function public.finalize_auction(uuid) to authenticated;
