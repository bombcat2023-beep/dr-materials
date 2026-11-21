'use client';

import { getElanthipediaUrl } from '@/lib/elanthipedia';
import React, { useState, useMemo } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { MaterialStat, MaterialListing, fmtNum, fmtUsd } from '@/types/market';

type Props = {
  stats: MaterialStat[];
  listings: MaterialListing[];
};

export function PriceIndexTab({ stats, listings }: Props) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stats.filter((m) => {
      const label = m.variant ? m.name + ' ' + m.variant : m.name;
      return label.toLowerCase().includes(q) || m.subcategory.toLowerCase().includes(q);
    });
  }, [stats, search]);

  const activeKey = useMemo(() => {
    if (selectedKey) return selectedKey;
    const withData = stats.find((s) => s.active_count > 0 || s.sold_count > 0);
    return withData ? withData.material_id + ':' + (withData.variant || '') : null;
  }, [selectedKey, stats]);

  const selected = useMemo(
    () => stats.find((s) => s.material_id + ':' + (s.variant || '') === activeKey) || null,
    [stats, activeKey]
  );

  const history = useMemo(() => {
    if (!selected) return [];
    return listings
      .filter(
        (l) =>
          l.material_id === selected.material_id &&
          (l.variant || '') === (selected.variant || '') &&
          l.listed_kronars != null
      )
      .slice()
      .reverse();
  }, [listings, selected]);

  const chartPoints = useMemo(() => {
    if (history.length === 0) return null;
    const values = history.flatMap((h) => [
      Number(h.listed_kronars || 0),
      ...(h.status === 'sold' && h.sold_kronars != null ? [Number(h.sold_kronars)] : []),
    ]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = maxVal - minVal || 1;

    const width = 640;
    const height = 200;
    const padX = 40;
    const padY = 24;

    const pts = history.map((h, idx) => {
      const x =
        history.length === 1
          ? width / 2
          : padX + (idx / (history.length - 1)) * (width - padX * 2);
      const listedY =
        height - padY - ((Number(h.listed_kronars) - minVal) / span) * (height - padY * 2);
      const soldY =
        h.status === 'sold' && h.sold_kronars != null
          ? height - padY - ((Number(h.sold_kronars) - minVal) / span) * (height - padY * 2)
          : null;

      return {
        id: h.id,
        x,
        listedY,
        soldY,
        listedPk: Number(h.listed_kronars),
        soldPk: h.sold_kronars != null ? Number(h.sold_kronars) : null,
        date: new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
    });

    return { width, height, minVal, maxVal, pts };
  }, [history]);
  
  return (
    <div className="space-y-6">
      {/* Stock-Ticker Price History Chart Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Material Price History (PK / Vol)
            </div>
            <h2 className="text-xl font-bold mt-0.5">
              {selected
                ? `${selected.name}${selected.variant ? ` (${selected.variant})` : ''}`
                : 'Select a material below'}
            </h2>
          </div>

          {selected && (
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-xs text-slate-400">Avg Listed / Vol</div>
                <div className="font-mono font-bold text-amber-400">
                  {fmtNum(selected.avg_listed_kronars)} PK Â· {fmtUsd(selected.avg_listed_usd)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg Sold / Vol</div>
                <div className="font-mono font-bold text-emerald-400">
                  {fmtNum(selected.avg_sold_kronars)} PK Â· {fmtUsd(selected.avg_sold_usd)}
                </div>
              </div>
            </div>
          )}
        </div>

        {!chartPoints ? (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-8 text-center text-sm text-slate-400">
            No PK price history recorded yet for this material. Click any row below or post a listing to start tracking its chart!
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-end gap-4 text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Listed PK/vol
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Sold PK/vol
              </span>
            </div>

            <svg viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`} className="w-full h-48 overflow-visible">
              {/* Top & Bottom Reference Lines */}
              <line x1="40" y1="24" x2={chartPoints.width - 40} y2="24" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="40" y1={chartPoints.height - 24} x2={chartPoints.width - 40} y2={chartPoints.height - 24} stroke="#1e293b" strokeDasharray="4 4" />
              <text x="0" y="28" fill="#64748b" fontSize="10">{fmtNum(chartPoints.maxVal)} PK</text>
              <text x="0" y={chartPoints.height - 20} fill="#64748b" fontSize="10">{fmtNum(chartPoints.minVal)} PK</text>

              {/* Listed Price Line */}
              {chartPoints.pts.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  points={chartPoints.pts.map((p) => `${p.x},${p.listedY}`).join(' ')}
                />
              )}

              {/* Data Points */}
              {chartPoints.pts.map((p) => (
                <g key={p.id}>
                  <circle cx={p.x} cy={p.listedY} r="4" fill="#fbbf24" />
                  <text x={p.x} y={p.listedY - 8} textAnchor="middle" fill="#fbbf24" fontSize="10">
                    {fmtNum(p.listedPk)}
                  </text>
                  {p.soldY != null && (
                    <>
                      <circle cx={p.x} cy={p.soldY} r="4.5" fill="#34d399" />
                      <text x={p.x} y={p.soldY + 14} textAnchor="middle" fill="#34d399" fontSize="10">
                        {fmtNum(p.soldPk)}
                      </text>
                    </>
                  )}
                  <text x={p.x} y={chartPoints.height - 6} textAnchor="middle" fill="#64748b" fontSize="9">
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </section>

      {/* Search & Ticker Table */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter ticker by material or sub-type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Material ({filtered.length})</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Listed Avg / Vol</th>
                <th className="px-4 py-3 text-right">Sold Avg / Vol</th>
                <th className="px-4 py-3 text-right">Trades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((m) => {
                const rowKey = `${m.material_id}:${m.variant || ''}`;
                const isSelected = rowKey === activeKey;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => setSelectedKey(rowKey)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      <a
                        href={getElanthipediaUrl(m.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber-400 hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {m.name}
                      </a>
                      {m.variant ? <span className="ml-1.5 text-amber-400 text-xs">({m.variant})</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{m.subcategory}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-amber-300">
                      {fmtNum(m.avg_listed_kronars)} PK / {fmtUsd(m.avg_listed_usd)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">
                      {fmtNum(m.avg_sold_kronars)} PK / {fmtUsd(m.avg_sold_usd)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-400">
                      {m.active_count} active Â· {m.sold_count} sold
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
