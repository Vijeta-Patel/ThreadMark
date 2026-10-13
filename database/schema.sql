-- ThreadMark database schema (Supabase Postgres).
-- Run this in the Supabase SQL editor. Shape is fixed by the project requirements, section 9.4.

create type garment_status as enum ('pending', 'confirmed', 'failed');

create table garments (
  pid                text primary key,
  sku                text not null unique,
  brand              text not null,
  fabric             text not null,
  origin             text not null,
  manufacturing_date date not null,
  image_ref          text,                         -- Supabase Storage path
  sha256_hash        text not null check (sha256_hash ~ '^[0-9a-f]{64}$'),
  tx_hash            text,
  status             garment_status not null default 'pending',
  qr_ref             text,                         -- the verification URL the QR code encodes
  created_by         uuid references auth.users(id),
  registered_at      timestamptz not null default now()
);

alter table garments enable row level security;
-- All reads and writes go through server API routes using the service-role key.
-- No public policies are created, so the browser cannot touch the table directly.
