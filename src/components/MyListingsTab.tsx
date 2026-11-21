'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Users,
  Coins,
  Pencil,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  MaterialStat,
  MaterialListing,
  CharacterListing,
  PlatListing,
  fmtNum,
  fmtUsd,
} from '@/types/market';

type Props = {
  userId: string;
  stats: MaterialStat[];
  listings: MaterialListing[];
  characters: CharacterListing[];
  plats: PlatListing[];
  onListMaterial: () => void;
  onEditMaterial: (listing: MaterialListing) => void;
  onMarkMaterialSold: (listing: MaterialListing) => void;
  onDeleteMaterial: (listing: MaterialListing) => void;
  onListCharacter: () => void;
  onEditCharacter: (char: CharacterListing) => void;
  onMarkCharacterSold: (char: CharacterListing) => void;
  onDeleteCharacter: (char: CharacterListing) => void;
  onListPlat: () => void;
  onEditPlat: (plat: PlatListing) => void;
  onMarkPlatSold: (plat: PlatListing) => void;
  onDeletePlat: (plat: PlatListing) => void;
};

export function MyListingsTab({
  userId,
  stats,
  listings,
  characters,
  plats,
  onListMaterial,
  onEditMaterial,
  onMarkMaterialSold,
  onDeleteMaterial,
  onListCharacter,
  onEditCharacter,
  onMarkCharacterSold,
  onDeleteCharacter,
  onListPlat,
  onEditPlat,
  onMarkPlatSold,
  onDeletePlat,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'sold' | 'all'>('active');

  const nameMap = useMemo(() => {
    const map = new Map<number, string>();
    stats.forEach((s) => map.set(s.material_id, s.name));
    return map;
  }, [stats]);

  const myMaterials = useMemo(
    () =>
      listings.filter(
        (l) =>
          l.seller_id === userId &&
          (statusFilter === 'all' || l.status === statusFilter)
      ),
    [listings, userId, statusFilter]
  );

  const myCharacters = useMemo(
    () =>
      characters.filter(
        (c) =>
          c.seller_id === userId &&
          (statusFilter === 'all' || c.status === statusFilter)
      ),
    [characters, userId, statusFilter]
  );

  const myPlats = useMemo(
    () =>
      plats.filter(
        (p) =>
          p.seller_id === userId &&
          (statusFilter === 'all' || p.status === statusFilter)
      ),
    [plats, userId, statusFilter]
  );

  const counts = useMemo(() => {
    const allM = listings.filter((l) => l.seller_id === userId);
    const allC = characters.filter((c) => c.seller_id === userId);
    const allP = plats.filter((p) => p.seller_id === userId);
    return {
      activeTotal:
        allM.filter((x) => x.status === 'active').length +
        allC.filter((x) => x.status === 'active').length +
        allP.filter((x) => x.status === 'active').length,
      soldTotal:
        allM.filter((x) => x.status === 'sold').length +
        allC.filter((x) => x.status === 'sold').length +
        allP.filter((x) => x.status === 'sold').length,
    };
  }, [listings, characters, plats, userId]);
  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">My Storefront Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {counts.activeTotal} active listing{counts.activeTotal === 1 ? '' : 's'} ·{' '}
            {counts.soldTotal} completed sale{counts.soldTotal === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
          {(['active', 'sold', 'all'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setStatusFilter(mode)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize cursor-pointer transition ${
                statusFilter === mode
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 1. My Material Listings */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Package className="w-4 h-4" />
            My Materials ({myMaterials.length})
          </h3>
          <button
            type="button"
            onClick={onListMaterial}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Material
          </button>
        </div>

        {myMaterials.length === 0 ? (
          <p className="text-xs text-slate-400">No {statusFilter === 'all' ? '' : statusFilter} material listings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myMaterials.map((l) => (
              <div
                key={l.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">
                        {nameMap.get(l.material_id) || 'Material'}
                        {l.variant ? ` (${l.variant})` : ''}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          l.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Vol: <strong className="text-slate-200">{l.quantity}</strong>
                      {l.quality ? ` · Q${l.quality}` : ''}
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    {l.listed_kronars != null && (
                      <div className="text-amber-400">{fmtNum(l.listed_kronars)} PK/vol</div>
                    )}
                    {l.listed_usd != null && (
                      <div className="text-amber-400">{fmtUsd(l.listed_usd)}/vol</div>
                    )}
                  </div>
                </div>

                {l.notes && <p className="text-xs text-slate-400 italic">{l.notes}</p>}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                  {l.status === 'active' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditMaterial(l)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkMaterialSold(l)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Sold
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteMaterial(l)}
                    className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* 2. My Character Listings */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Characters ({myCharacters.length})
          </h3>
          <button
            type="button"
            onClick={onListCharacter}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Character
          </button>
        </div>

        {myCharacters.length === 0 ? (
          <p className="text-xs text-slate-400">No {statusFilter === 'all' ? '' : statusFilter} character listings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myCharacters.map((c) => (
              <div
                key={c.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">
                        {c.character_name || 'Unnamed ' + c.guild}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Circle {c.circle} {c.race} {c.guild}
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-amber-400">
                    {c.asking_pk != null && <div>{fmtNum(c.asking_pk)} PK</div>}
                    {c.asking_usd != null && <div>{fmtUsd(c.asking_usd)}</div>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                  {c.status === 'active' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditCharacter(c)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkCharacterSold(c)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Sold
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteCharacter(c)}
                    className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. My Plat Listings */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            My Plats ({myPlats.length})
          </h3>
          <button
            type="button"
            onClick={onListPlat}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New PK Lot
          </button>
        </div>

        {myPlats.length === 0 ? (
          <p className="text-xs text-slate-400">No {statusFilter === 'all' ? '' : statusFilter} PK listings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myPlats.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-100">
                        {fmtNum(p.pk_amount)} PK
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {fmtUsd(p.usd_per_1k)} / 1,000 PK
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-amber-400">
                    {fmtUsd((Number(p.pk_amount) / 1000) * Number(p.usd_per_1k))} total
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                  {p.status === 'active' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditPlat(p)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkPlatSold(p)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Sold
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeletePlat(p)}
                    className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 px-2 py-1 rounded text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
