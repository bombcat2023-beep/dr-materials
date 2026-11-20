'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Plus,
  User,
  MessageSquare,
  Trash2,
  Pencil,
} from 'lucide-react';
import { MaterialStat, MaterialListing, fmtNum, fmtUsd } from '@/types/market';

type Props = {
  stats: MaterialStat[];
  listings: MaterialListing[];
  userId?: string;
  onListMaterial: (materialId?: number) => void;
  onMarkSold: (listing: MaterialListing) => void;
  onEdit: (listing: MaterialListing) => void;
  onDelete: (listing: MaterialListing) => void;
};

export function MaterialsTab({
  stats,
  listings,
  userId,
  onListMaterial,
  onMarkSold,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const nameMap = useMemo(() => {
    const map = new Map<number, string>();
    stats.forEach((s) => map.set(s.material_id, s.name));
    return map;
  }, [stats]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return stats.filter((m) => {
      const label = m.variant ? `${m.name} ${m.variant}` : m.name;

      return (
        label.toLowerCase().includes(q) ||
        m.subcategory.toLowerCase().includes(q)
      );
    });
  }, [stats, search]);

  const activeFeed = useMemo(
    () => listings.filter((l) => l.status === 'active'),
    [listings]
  );

  const selected = useMemo(
    () =>
      stats.find(
        (s) => `${s.material_id}:${s.variant || ''}` === selectedKey
      ) || null,
    [stats, selectedKey]
  );
 
  const selectedListings = useMemo(() => {
    if (!selected) return [];
    return listings.filter(
      (l) =>
        l.material_id === selected.material_id &&
        (!selected.variant || (l.variant || '') === selected.variant)
    );
  }, [listings, selected]);

  return (
    <div className="space-y-6">
      {/* Live Active Listings Feed */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Active Player Listings ({activeFeed.length})
          </h2>

          {userId && (
            <button
              type="button"
              onClick={() => onListMaterial(selected?.material_id)}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Material for Sale
            </button>
          )}
        </div>

        {activeFeed.length === 0 ? (
          <p className="text-sm text-slate-400">
            No active material listings yet. Sign in and click &ldquo;List
            Material&rdquo; to post the first one!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeFeed.map((l) => (
              <div
                key={l.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-100">
                      {nameMap.get(l.material_id) || 'Material'}
                      {l.variant ? ` (${l.variant})` : ''}
                    </span>

                    <div className="text-xs text-slate-400 mt-0.5">
                      Vol: <strong className="text-slate-200">{l.quantity}</strong>
                      {l.quality ? ` · Q${l.quality}` : ''}
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    {l.listed_kronars != null && (
                      <div className="text-amber-400">
                        {fmtNum(l.listed_kronars)} PK/vol{' '}
                        <span className="text-slate-400">
                          ({fmtNum(l.listed_kronars * l.quantity)} PK total)
                        </span>
                      </div>
                    )}

                    {l.listed_usd != null && (
                      <div className="text-amber-400">
                        {fmtUsd(l.listed_usd)}/vol{' '}
                        <span className="text-slate-400">
                          ({fmtUsd(l.listed_usd * l.quantity)} total)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {l.notes && (
                  <p className="text-xs text-slate-400 italic">{l.notes}</p>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <strong>{l.seller_contact}</strong>
                    </span>

                    {l.discord_handle && (
                      <span className="inline-flex items-center gap-1 text-indigo-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {l.discord_handle}
                      </span>
                    )}

                    {l.seller_discord_id && (
                      <a
                        href={`https://discord.com/users/${l.seller_discord_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-xs font-medium transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Message on Discord
                      </a>
                    )}
                  </div>

                  {userId === l.seller_id && (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(l)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkSold(l)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Sold
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(l)}
                        title="Delete listing"
                        className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

        <input
          type="text"
          placeholder="Search materials or sub-types (e.g. Heavy Titanese, Lelori Limb, Diamondique Boulder)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Selected Material Detail Panel */}
      {selected && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                {selected.subcategory}
                {selected.variant ? ` · ${selected.variant}` : ''}
              </span>

              <h2 className="text-2xl font-bold">
                {selected.name}
                {selected.variant ? ` (${selected.variant})` : ''}
              </h2>

              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-slate-300">
                <span>
                  Avg Listed / Vol:{' '}
                  <strong>{fmtNum(selected.avg_listed_kronars)}</strong> PK /{' '}
                  <strong>{fmtUsd(selected.avg_listed_usd)}</strong>
                </span>

                <span>
                  Avg Sold / Vol:{' '}
                  <strong className="text-emerald-400">
                    {fmtNum(selected.avg_sold_kronars)}
                  </strong>{' '}
                  PK /{' '}
                  <strong className="text-emerald-400">
                    {fmtUsd(selected.avg_sold_usd)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {userId && (
                <button
                  type="button"
                  onClick={() => onListMaterial(selected.material_id)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  + List {selected.name}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Material Listing History */}
          <div className="space-y-2">
            {selectedListings.length === 0 ? (
              <p className="text-sm text-slate-400">
                No history yet for {selected.name}.
              </p>
            ) : (
              selectedListings.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        l.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {l.status.toUpperCase()}
                    </span>

                    <span>
                      Vol: <strong>{l.quantity}</strong>
                      {l.quality ? ` (Q${l.quality})` : ''}
                    </span>

                    <span>
                      Listed:{' '}
                      {l.listed_kronars != null && (
                        <strong>{fmtNum(l.listed_kronars)} PK/vol</strong>
                      )}
                      {l.listed_kronars != null &&
                        l.listed_usd != null &&
                        ' / '}
                      {l.listed_usd != null && (
                        <strong>{fmtUsd(l.listed_usd)}/vol</strong>
                      )}
                    </span>

                    {l.status === 'sold' && (
                      <span className="text-emerald-400">
                        Sold:{' '}
                        {l.sold_kronars != null && (
                          <strong>{fmtNum(l.sold_kronars)} PK/vol</strong>
                        )}
                        {l.sold_kronars != null &&
                          l.sold_usd != null &&
                          ' / '}
                        {l.sold_usd != null && (
                          <strong>{fmtUsd(l.sold_usd)}/vol</strong>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-300">
                      Seller: <strong>{l.seller_contact}</strong>
                    </span>

                    {l.discord_handle && (
                      <span className="text-indigo-400">
                        ({l.discord_handle})
                      </span>
                    )}

                    {l.seller_discord_id && (
                      <a
                        href={`https://discord.com/users/${l.seller_discord_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-xs font-medium transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Message on Discord
                      </a>
                    )}

                    {userId === l.seller_id && l.status === 'active' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(l)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onMarkSold(l)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Sold
                        </button>
                      </>
                    )}

                    {userId === l.seller_id && (
                      <button
                        type="button"
                        onClick={() => onDelete(l)}
                        title="Delete listing"
                        className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Alphabetical Materials Price Index Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Material ({filtered.length})</th>
                <th className="px-4 py-3">Type / Variant</th>
                <th className="px-4 py-3 text-right">Active</th>
                <th className="px-4 py-3 text-right">Avg Listed / Vol</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-4 py-3 text-right">Avg Sold / Vol</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((m) => {
                const rowKey = `${m.material_id}:${m.variant || ''}`;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => setSelectedKey(rowKey)}
                    className="hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {m.name}
                      {m.variant ? (
                        <span className="ml-1.5 text-amber-400 text-xs">
                          ({m.variant})
                        </span>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-300">
                      {m.subcategory}
                    </td>

                    <td className="px-4 py-3 text-right">{m.active_count}</td>

                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {fmtNum(m.avg_listed_kronars)} PK /{' '}
                      {fmtUsd(m.avg_listed_usd)}
                    </td>

                    <td className="px-4 py-3 text-right">{m.sold_count}</td>

                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">
                      {fmtNum(m.avg_sold_kronars)} PK /{' '}
                      {fmtUsd(m.avg_sold_usd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}