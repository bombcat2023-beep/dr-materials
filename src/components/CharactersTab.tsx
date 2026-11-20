```tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  User,
  MessageSquare,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react';
import { CharacterListing, fmtNum, fmtUsd } from '@/types/market';

const GUILDS = [
  'All',
  'Barbarian',
  'Bard',
  'Cleric',
  'Commoner',
  'Empath',
  'Moon Mage',
  'Necromancer',
  'Paladin',
  'Ranger',
  'Thief',
  'Trader',
  'Warrior Mage',
];

type Props = {
  characters: CharacterListing[];
  userId?: string;
  onListCharacter: () => void;
  onMarkSold: (char: CharacterListing) => void;
  onEdit: (char: CharacterListing) => void;
  onDelete: (char: CharacterListing) => void;
};

export function CharactersTab({
  characters,
  userId,
  onListCharacter,
  onMarkSold,
  onEdit,
  onDelete,
}: Props) {
  const [guildFilter, setGuildFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return characters.filter((c) => {
      const matchesGuild = guildFilter === 'All' || c.guild === guildFilter;

      const matchesText =
        !q ||
        (c.character_name || '').toLowerCase().includes(q) ||
        c.guild.toLowerCase().includes(q) ||
        c.race.toLowerCase().includes(q) ||
        (c.highlights || '').toLowerCase().includes(q);

      return matchesGuild && matchesText;
    });
  }, [characters, guildFilter, search]);

  return (
    <div className="space-y-5">
      {/* Header & Post Listing Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400">
          Community Character Exchange — Coordinate character transfers or account
          takeovers directly via Discord or Simutronics.
        </p>

        {userId && (
          <button
            type="button"
            onClick={onListCharacter}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3.5 py-2 rounded-lg text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Post Character for Sale
          </button>
        )}
      </div>

      {/* Search & Guild Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

          <input
            type="text"
            placeholder="Search by guild, race, skills, TDs, or alters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GUILDS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGuildFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                guildFilter === g
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Character Listings */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-sm text-slate-400">
          No character listings match your filter yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              {/* Character Information */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Circle {c.circle} {c.race} {c.guild}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100">
                  {c.character_name || 'Unnamed ' + c.guild}
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  {c.account_takeover
                    ? 'Full Account Takeover'
                    : 'Character Transfer Only'}
                </p>

                {c.highlights && (
                  <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">
                    {c.highlights}
                  </p>
                )}
              </div>

              {/* Pricing & Seller Controls */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400">Asking: </span>

                    {c.asking_pk != null && (
                      <strong className="text-amber-400 font-mono">
                        {fmtNum(c.asking_pk)} PK
                      </strong>
                    )}

                    {c.asking_pk != null &&
                      c.asking_usd != null &&
                      ' / '}

                    {c.asking_usd != null && (
                      <strong className="text-amber-400 font-mono">
                        {fmtUsd(c.asking_usd)}
                      </strong>
                    )}
                  </div>

                  {c.status === 'sold' && (
                    <div className="text-emerald-400">
                      <span>Sold: </span>

                      {c.sold_pk != null && (
                        <strong className="font-mono">
                          {fmtNum(c.sold_pk)} PK
                        </strong>
                      )}

                      {c.sold_pk != null &&
                        c.sold_usd != null &&
                        ' / '}

                      {c.sold_usd != null && (
                        <strong className="font-mono">
                          {fmtUsd(c.sold_usd)}
                        </strong>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit, Mark Sold & Delete — Owner Only */}
                {userId === c.seller_id && (
                  <div className="inline-flex items-center gap-1.5">
                    {c.status === 'active' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onMarkSold(c)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Sold
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Seller Contact */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5 text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <strong>{c.seller_contact}</strong>
                    </span>

                    {c.discord_handle && (
                      <span className="inline-flex items-center gap-1 text-indigo-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {c.discord_handle}
                      </span>
                    )}

                    {c.seller_discord_id && (
                      <a
                        href={`https://discord.com/users/${c.seller_discord_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-xs font-medium transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Message on Discord
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}