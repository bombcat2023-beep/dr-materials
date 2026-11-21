'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MaterialStat, MaterialListing, SUBTYPE_OPTIONS, fmtNum, fmtUsd } from '@/types/market';

type ListMaterialModalProps = {
  open: boolean;
  stats: MaterialStat[];
  initialMatId: number | '';
  defaultContact: string;
  editing?: MaterialListing | null;
  onClose: () => void;
  onSubmit: (payload: {
    material_id: number;
    variant: string | null;
    quantity: number;
    quality: number | null;
    listed_unit_price: number;
    currency: string;
    listed_kronars: number | null;
    listed_usd: number | null;
    seller_contact: string;
    discord_handle: string | null;
    notes: string | null;
  }) => Promise<void>;
};

export function ListMaterialModal({
  open, stats, initialMatId, defaultContact, editing, onClose, onSubmit,
}: ListMaterialModalProps) {
  const [matSearch, setMatSearch] = useState('');
  const [matId, setMatId] = useState<number | ''>(initialMatId);
  const [variant, setVariant] = useState('');
  const [qty, setQty] = useState('1');
  const [quality, setQuality] = useState('');
  const [priceMode, setPriceMode] = useState<'Kronars' | 'USD' | 'Both'>('Kronars');
  const [kronars, setKronars] = useState('');
  const [usd, setUsd] = useState('');
  const [contact, setContact] = useState(defaultContact);
  const [discord, setDiscord] = useState('');
  const [notes, setNotes] = useState('');

  const uniqueMaterials = useMemo(() => {
    const map = new Map<number, MaterialStat>();
    stats.forEach((s) => { if (!map.has(s.material_id)) map.set(s.material_id, s); });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [stats]);

  const matchingMaterials = useMemo(() => {
    const q = matSearch.toLowerCase().trim();
    if (!q) return uniqueMaterials;
    return uniqueMaterials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.subcategory.toLowerCase() === q
    );
  }, [uniqueMaterials, matSearch]);

  const selectedMat = useMemo(
    () => uniqueMaterials.find((m) => m.material_id === Number(matId)) || null,
    [uniqueMaterials, matId]
  );

  const subtypeChoices = selectedMat ? SUBTYPE_OPTIONS[selectedMat.subcategory] || null : null;

  useEffect(() => {
    if (editing) {
      setMatId(editing.material_id);
      setMatSearch('');
      setVariant(editing.variant || '');
      setQty(String(editing.quantity));
      setQuality(editing.quality != null ? String(editing.quality) : '');
      const mode =
        editing.listed_kronars != null && editing.listed_usd != null
          ? 'Both'
          : editing.listed_usd != null
          ? 'USD'
          : 'Kronars';
      setPriceMode(mode);
      setKronars(editing.listed_kronars != null ? String(editing.listed_kronars) : '');
      setUsd(editing.listed_usd != null ? String(editing.listed_usd) : '');
      setContact(editing.seller_contact);
      setDiscord(editing.discord_handle || '');
      setNotes(editing.notes || '');
    } else {
      setMatId(initialMatId);
      setMatSearch('');
      setQty('1');
      setQuality('');
      setKronars('');
      setUsd('');
      setNotes('');
    }
  }, [editing, initialMatId, open]);

  useEffect(() => {
    if (editing && editing.material_id === Number(matId) && editing.variant) return;
    if (subtypeChoices && subtypeChoices.length > 0) {
      setVariant(subtypeChoices[0]);
    } else {
      setVariant('');
    }
  }, [matId]);

  useEffect(() => {
    if (defaultContact && !contact && !editing) setContact(defaultContact);
  }, [defaultContact]);

  if (!open) return null;

  const volNum = Math.max(1, Number(qty) || 1);
  const kPerVol = (priceMode === 'Kronars' || priceMode === 'Both') && kronars ? Number(kronars) : null;
  const uPerVol = (priceMode === 'USD' || priceMode === 'Both') && usd ? Number(usd) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matId || !contact) return;
    if (kPerVol == null && uPerVol == null) return;

    await onSubmit({
      material_id: Number(matId),
      variant: subtypeChoices ? variant || subtypeChoices[0] : null,
      quantity: volNum,
      quality: quality ? Number(quality) : null,
      listed_unit_price: kPerVol ?? uPerVol ?? 1,
      currency: priceMode,
      listed_kronars: kPerVol,
      listed_usd: uPerVol,
      seller_contact: contact.trim(),
      discord_handle: discord.trim() || null,
      notes: notes.trim() || null,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-3.5 my-8">
        <h2 className="text-lg font-bold">{editing ? 'Edit Material Listing' : 'List Material for Sale'}</h2>

        {/* Searchable Material Picker */}
        <div className="space-y-1.5">
          <label className="block text-xs text-slate-400">Search &amp; Select Material</label>
          <input
            type="text"
            placeholder="Type to filter materials (e.g. Kertig, Felstone, Lelori)..."
            value={matSearch}
            onChange={(e) => {
              setMatSearch(e.target.value);
              const q = e.target.value.toLowerCase().trim();
              if (q) {
                const firstMatch = uniqueMaterials.find((m) => m.name.toLowerCase().includes(q));
                if (firstMatch) setMatId(firstMatch.material_id);
              }
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400"
          />
          <select
            required
            value={matId}
            onChange={(e) => setMatId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select material ({matchingMaterials.length} matches)...</option>
            {matchingMaterials.map((m) => (
              <option key={m.material_id} value={m.material_id}>
                {m.name} ({m.subcategory})
              </option>
            ))}
          </select>
        </div>

        {/* Conditional Sub-Type Dropdown for Cloth, Stone, and Wood */}
        {subtypeChoices && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {selectedMat?.subcategory} Sub-Type
            </label>
            <select
              required
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-300"
            >
              {subtypeChoices.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Volume</label>
            <input
              type="number"
              min="1"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Quality (1–99, optional)</label>
            <input
              type="number"
              min="1"
              max="99"
              placeholder="Optional"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">List Price Per Volume In</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Kronars', 'USD', 'Both'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPriceMode(mode)}
                className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                  priceMode === mode
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                }`}
              >
                {mode === 'USD' ? '$ (USD)' : mode === 'Kronars' ? 'PK' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        {(priceMode === 'Kronars' || priceMode === 'Both') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Price Per Volume (PK)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 3000"
              value={kronars}
              onChange={(e) => setKronars(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        {(priceMode === 'USD' || priceMode === 'Both') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Price Per Volume ($ USD)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 5.00"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Live Total Listing Price Calculator */}
        {(kPerVol != null || uPerVol != null) && (
          <div className="bg-slate-950 border border-amber-500/30 rounded-lg px-3.5 py-2.5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Total Listing Price ({volNum} vol):</span>
            <span className="font-mono font-bold text-amber-400">
              {kPerVol != null && fmtNum(kPerVol * volNum) + ' PK'}
              {kPerVol != null && uPerVol != null && ' / '}
              {uPerVol != null && fmtUsd(uPerVol * volNum)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Character / Seller Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Handle"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Discord Handle (optional)</label>
            <input
              type="text"
              placeholder="e.g. Discord Username"
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
            placeholder="e.g. Any Useful Additional Information"
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
            {editing ? 'Save Changes' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
type MarkSoldModalProps = {
  listing: MaterialListing | null;
  onClose: () => void;
  onConfirm: (
    quantitySold: number,
    soldKronars: number | null,
    soldUsd: number | null
  ) => Promise<void>;
};

export function MarkSoldModal({ listing, onClose, onConfirm }: MarkSoldModalProps) {
  const [quantitySold, setQuantitySold] = useState('');
  const [kronars, setKronars] = useState('');
  const [usd, setUsd] = useState('');

  useEffect(() => {
    if (listing) {
      setQuantitySold(String(listing.quantity));
      setKronars(listing.listed_kronars != null ? String(listing.listed_kronars) : '');
      setUsd(listing.listed_usd != null ? String(listing.listed_usd) : '');
    }
  }, [listing]);

  if (!listing) return null;

  const pkVal = kronars ? Number(kronars) : null;
  const usdVal = usd ? Number(usd) : null;
  const qtyVal = quantitySold ? Number(quantitySold) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      qtyVal == null ||
      !Number.isInteger(qtyVal) ||
      qtyVal < 1 ||
      qtyVal > listing.quantity
    ) {
      return;
    }

    if (pkVal == null && usdVal == null) return;

    await onConfirm(qtyVal, pkVal, usdVal);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold">Record Final Sold Price / Vol</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the final price <strong>per volume</strong> ({listing.quantity} vol listed) in <strong>PK</strong>, <strong>$ (USD)</strong>, or both to update the live market average.
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantity Sold</label>
          <input
            type="number"
            step="1"
            min="1"
            max={listing.quantity}
            required
            value={quantitySold}
            onChange={(e) => setQuantitySold(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            Maximum available: {listing.quantity}
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Sold Price Per Volume (PK)</label>
          <input
            type="number"
            step="any"
            min="0.01"
            placeholder="e.g. 3000 (optional if sold for $)"
            value={kronars}
            onChange={(e) => setKronars(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Sold Price Per Volume ($ USD)</label>
          <input
            type="number"
            step="any"
            min="0.01"
            placeholder="e.g. 5.00 (optional if sold for PK)"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {qtyVal != null && qtyVal > 0 && (pkVal != null || usdVal != null) && (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-lg px-3.5 py-2 text-xs flex items-center justify-between">
            <span className="text-slate-400">Total Sale ({qtyVal} vol):</span>
            <span className="font-mono font-bold text-emerald-400">
              {pkVal != null && fmtNum(pkVal * qtyVal) + ' PK'}
              {pkVal != null && usdVal != null && ' / '}
              {usdVal != null && fmtUsd(usdVal * qtyVal)}
            </span>
          </div>
        )}

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

type EmailAuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supabase: any;
};

export function EmailAuthModal({ open, onClose, onSuccess, supabase }: EmailAuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setEmail('');
      setPassword('');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">{isSignUp ? 'Create Email Account' : 'Sign in with Email'}</h2>
        {errorMsg && <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 rounded p-2">{errorMsg}</p>}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Password (min 6 characters)</label>
          <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }} className="text-xs text-amber-400 hover:underline cursor-pointer">
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer">
              {loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
