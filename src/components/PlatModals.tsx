'use client';

import React, { useState, useEffect } from 'react';
import { PlatListing, fmtUsd } from '@/types/market';

type ListPlatModalProps = {
  open: boolean;
  defaultContact: string;
  onClose: () => void;
  onSubmit: (payload: {
    pk_amount: number;
    usd_per_1k: number;
    notes: string | null;
    seller_contact: string;
    discord_handle: string | null;
  }) => Promise<void>;
};

export function ListPlatModal({ open, defaultContact, onClose, onSubmit }: ListPlatModalProps) {
  const [pkAmount, setPkAmount] = useState('10000');
  const [ratePer1k, setRatePer1k] = useState('');
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState(defaultContact);
  const [discord, setDiscord] = useState('');

  useEffect(() => {
    if (defaultContact && !contact) setContact(defaultContact);
  }, [defaultContact]);

  if (!open) return null;

  const pkNum = Number(pkAmount) || 0;
  const rateNum = Number(ratePer1k) || 0;
  const totalUsd = pkNum > 0 && rateNum > 0 ? (pkNum / 1000) * rateNum : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pkNum <= 0 || rateNum <= 0 || !contact) return;

    await onSubmit({
      pk_amount: pkNum,
      usd_per_1k: rateNum,
      notes: notes.trim() || null,
      seller_contact: contact.trim(),
      discord_handle: discord.trim() || null,
    });
    setRatePer1k('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold">List Platinum Kronars (PK) for Sale</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Total PK Amount</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="e.g. 25000"
              value={pkAmount}
              onChange={(e) => setPkAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Rate ($ per 1,000 PK)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 0.85"
              value={ratePer1k}
              onChange={(e) => setRatePer1k(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {totalUsd > 0 && (
          <div className="bg-slate-950 border border-amber-500/30 rounded-lg px-3.5 py-2.5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Calculated Lot Total:</span>
            <span className="font-mono font-bold text-amber-400">{fmtUsd(totalUsd)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seller Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Seller's Handle"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Discord Handle (optional)</label>
            <input
              type="text"
              placeholder="e.g. Discord Display Name"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. PayPal F&F/Venmo/Gift of Adventure"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer">
            Post PK Listing
          </button>
        </div>
      </form>
    </div>
  );
}

type MarkPlatSoldProps = {
  plat: PlatListing | null;
  onClose: () => void;
  onConfirm: (soldRatePer1k: number) => Promise<void>;
};

export function MarkPlatSoldModal({ plat, onClose, onConfirm }: MarkPlatSoldProps) {
  const [rate, setRate] = useState('');

  useEffect(() => {
    if (plat) setRate(String(plat.usd_per_1k));
  }, [plat]);

  if (!plat) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(rate);
    if (!val || val <= 0) return;
    await onConfirm(val);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">Record Completed PK Sale</h2>
        <p className="text-xs text-slate-400">
          Confirm the final sold rate per 1,000 PK to update the live market value average.
        </p>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Sold Rate ($ per 1,000 PK)</label>
          <input
            type="number"
            step="any"
            min="0.01"
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
            Confirm Sold
          </button>
        </div>
      </form>
    </div>
  );
}
