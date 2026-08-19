-- La Chimère — préférences de notifications par membre (CDC 14.4)
alter table profiles add column notification_prefs jsonb not null default '{}'::jsonb;
