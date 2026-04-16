-- Stores the full state of a completed trip recap so it can be rendered
-- from a shareable URL. One row per share link. Written once, read many.
--
-- Run this in the Supabase SQL editor (Project → SQL → New query) before
-- shipping the share feature. The app's backend uses the service role key
-- which bypasses RLS, so no policies are required for this MVP.

create extension if not exists "pgcrypto";

create table if not exists public.shared_trips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  trip_label text,
  trip_config jsonb not null,
  itinerary jsonb not null,
  answers_by_stop_id jsonb not null default '{}'::jsonb,
  synthesized_by_stop jsonb not null default '{}'::jsonb
);

create index if not exists shared_trips_created_at_idx
  on public.shared_trips (created_at desc);
