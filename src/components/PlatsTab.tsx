'use client';

import React, { useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  User,
  MessageSquare,
  Coins,
  Trash2,
  Pencil,
} from 'lucide-react';
import { PlatListing, fmtNum, fmtUsd } from '@/types/market';

type Props = {
  plats: PlatListing[];
  userId?: string;
  onListPlat: () => void;
  onMarkSold: (plat: PlatListing) => void;
  onEdit: (plat: PlatListing) => void;
  onDelete: (plat: PlatListing) => void;
};

export function PlatsTab({
  plats,
  userId,
  onListPlat,
  onMarkSold,
  onEdit,
  onDelete,
}: Props) {
  const stats = useMemo(() => {
    const active = plats.filter((p) => p.status === 'active');

    const sold = plats.filter(
      (p) => p.status === 'sold' && p.sold_usd_per_1k != null
    );

    const avgActiveRate =
      active.length > 0
        ? active.reduce((sum, p) => sum + Number(p.usd_per_1k), 0) /
          active.length
        : null;

    const avgSoldRate =
      sold.length > 0
        ? sold.reduce(
            (sum, p) => sum + Number(p.sold_usd_per_1k),
            0
          ) / sold.length
        : null;

    const totalAvailablePk = active.reduce(
      (sum, p) => sum + Number(p.pk_amount),
      0
    );

    return {
      active,
      sold,
      avgActiveRate,
      avgSoldRate,
      totalAvailablePk,
    };
  }, [plats]);

  return (
    <div className="space-y-6">
      {/* Live PK Exchange Rate Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Avg Listed Rate
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {fmtUsd(stats.avgActiveRate)}{' '}
            <span className="text-xs font-normal text-slate-400">
              / 1,000 PK
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Avg Sold Rate (Market Value)
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {fmtUsd(stats.avgSoldRate)}{' '}
            <span className="text-xs font-normal text-slate-400">
              / 1,000 PK
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Available Supply
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {fmtNum(stats.totalAvailablePk)}{' '}
              <span className="text-xs font-normal text-slate-400">PK</span>
            </div>
          </div>

          {userId && (
            <button
              type="button"
              onClick={onListPlat}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3.5 py-2 rounded-lg text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Sell PK
            </button>
          )}
        </div>
      </div>

      {/* Active PK Listings */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Coins className="w-4 h-4" />
          Active Plats for Sale ({stats.active.length})
        </h2>

        {stats.active.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
            No active PK listings yet. Sign in and click &ldquo;Sell PK&rdquo;
            to establish the first listing!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.active.map((p) => {
              const totalUsd =
                (Number(p.pk_amount) / 1000) * Number(p.usd_per_1k);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-bold font-mono text-slate-100">
                        {fmtNum(p.pk_amount)} PK
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Rate:{' '}
                        <strong className="text-amber-400">
                          {fmtUsd(p.usd_per_1k)}
                        </strong>{' '}
                        per 1,000 PK
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Lot Total</div>
                      <div className="text-lg font-bold font-mono text-amber-400">
                        {fmtUsd(totalUsd)}
                      </div>
                    </div>
                  </div>

                  {p.notes && (
                    <p className="text-xs text-slate-300 italic">{p.notes}</p>
                  )}

                  {userId === p.seller_id && (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkSold(p)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Sold
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2.5 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <strong>{p.seller_contact}</strong>
                      </span>

                      {p.discord_handle && (
                        <span className="inline-flex items-center gap-1 text-indigo-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {p.discord_handle}
                        </span>
                      )}

                      {p.seller_discord_id && (
                        <a
                          href={`https://discord.com/users/${p.seller_discord_id}`}
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
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Completed PK Sales */}
      {stats.sold.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Recent Completed PK Sales ({stats.sold.length})
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {stats.sold.map((p) => (
              <div
                key={p.id}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span>
                  <strong className="text-slate-200">
                    {fmtNum(p.pk_amount)} PK
                  </strong>{' '}
                  sold at{' '}
                  <strong className="text-emerald-400 font-mono">
                    {fmtUsd(p.sold_usd_per_1k)} / 1,000 PK
                  </strong>
                </span>

                <span className="text-slate-400">
                  {new Date(p.created_at).toLocaleDateString()} · Seller:{` `}
                  {p.seller_contact}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}