-- Limite l'alerte clé WhatsApp à 2 envois maximum par jour (au total, quel
-- que soit le nombre de participants) pour éviter de spammer le groupe.
-- Compteur partagé par jour, incrémenté via une fonction dédiée qui applique
-- elle-même le plafond de façon atomique (protège contre deux membres qui
-- cliquent en même temps).
create table key_alert_sends (
  event_date date primary key,
  click_count smallint not null default 0 check (click_count between 0 and 2),
  updated_at timestamptz not null default now()
);

alter table key_alert_sends enable row level security;

create policy "key_alert_sends_select_authenticated"
  on key_alert_sends for select
  to authenticated
  using (true);

-- Pas de policy insert/update pour authenticated : les clics passent
-- uniquement par cette fonction (security definer).
create or replace function increment_key_alert(p_event_date date)
returns table(new_count smallint, incremented boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count smallint;
begin
  insert into key_alert_sends as k (event_date, click_count)
  values (p_event_date, 1)
  on conflict (event_date) do update
    set click_count = k.click_count + 1,
        updated_at = now()
    where k.click_count < 2
  returning k.click_count into v_count;

  if found then
    return query select v_count, true;
    return;
  end if;

  select click_count into v_count from key_alert_sends where event_date = p_event_date;
  return query select v_count, false;
end;
$$;

grant execute on function increment_key_alert(date) to authenticated;
