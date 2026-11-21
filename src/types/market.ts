export type MaterialStat = {
  material_id: number;
  name: string;
  subcategory: string;
  variant: string | null;
  active_count: number;
  avg_listed_kronars: number | null;
  avg_listed_usd: number | null;
  sold_count: number;
  avg_sold_kronars: number | null;
  avg_sold_usd: number | null;
};

export type MaterialListing = {
  id: string;
  seller_id: string;
  material_id: number;
  variant: string | null;
  quantity: number;
  quality: number | null;
  listed_kronars: number | null;
  listed_usd: number | null;
  sold_kronars: number | null;
  sold_usd: number | null;
  status: 'active' | 'sold' | 'cancelled';
  seller_contact: string;
  discord_handle: string | null;
  seller_discord_id: string | null;
  notes: string | null;
  created_at: string;
};

export type MaterialSale = {
  id: string;
  listing_id: string | null;
  seller_id: string;
  seller_handle: string;
  material_id: number;
  material_name: string;
  variant: string | null;
  quality: number | null;
  quantity_sold: number;
  sold_kronars: number | null;
  sold_usd: number | null;
  total_kronars: number | null;
  total_usd: number | null;
  sold_at: string;
};

export type CharacterListing = {
  id: string;
  seller_id: string;
  character_name: string | null;
  guild: string;
  race: string;
  circle: number;
  asking_pk: number | null;
  asking_usd: number | null;
  sold_pk: number | null;
  sold_usd: number | null;
  account_takeover: boolean;
  highlights: string | null;
  seller_contact: string;
  discord_handle: string | null;
  seller_discord_id: string | null;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
};

export type PlatListing = {
  id: string;
  seller_id: string;
  pk_amount: number;
  usd_per_1k: number;
  sold_usd_per_1k: number | null;
  notes: string | null;
  seller_contact: string;
  discord_handle: string | null;
  seller_discord_id: string | null;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
};

export const SUBTYPE_OPTIONS: Record<string, string[]> = {
  Cloth: ['Fine', 'Thin', 'Average', 'Thick', 'Heavy'],
  Stone: ['Pebble', 'Stone', 'Small Rock', 'Large Rock', 'Boulder'],
  Wood: ['Stick', 'Branch', 'Limb', 'Log', 'Thick Log'],
};

export const fmtNum = (n: number | null) =>
  n == null ? '—' : Number(n).toLocaleString();

export const fmtUsd = (n: number | null) =>
  n == null
    ? '—'
    : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
