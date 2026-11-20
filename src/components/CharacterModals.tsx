'use client';

import React, { useState, useEffect } from 'react';
import { CharacterListing } from '@/types/market';

const GUILDS = [
  'Barbarian', 'Bard', 'Cleric', 'Commoner', 'Empath', 'Moon Mage',
  'Necromancer', 'Paladin', 'Ranger', 'Thief', 'Trader', 'Warrior Mage',
];

type ListCharacterModalProps = {
  open: boolean;
  defaultContact: string;
  editing?: CharacterListing | null;
  onClose: () => void;
  onSubmit: (payload: {
    character_name: string | null;
    guild: string;
    race: string;
    circle: number;
    asking_pk: number | null;
    asking_usd: number | null;
    account_takeover: boolean;
    highlights: string | null;
    seller_contact: string;
    discord_handle: string | null;
  }) => Promise<void>;
};

export function ListCharacterModal({ open, defaultContact, editing, onClose, onSubmit }: ListCharacterModalProps) {
  const [name, setName] = useState('');
  const [guild, setGuild] = useState('Warrior Mage');
  const [race, setRace] = useState('Human');
  const [circle, setCircle] = useState('100');
  const [priceMode, setPriceMode] = useState<'USD' | 'PK' | 'Both'>('USD');
  const [pk, setPk] = useState('');
  const [usd, setUsd] = useState('');
  const [takeover, setTakeover] = useState(true);
  const [highlights, setHighlights] = useState('');
  const [contact, setContact] = useState(defaultContact);
  const [discord, setDiscord] = useState('');

  useEffect(() => {
    if (editing) {
      setName(editing.character_name || '');
      setGuild(editing.guild);
      setRace(editing.race);
      setCircle(String(editing.circle));
      const mode =
        editing.asking_pk != null && editing.asking_usd != null
          ? 'Both'
          : editing.asking_pk != null
          ? 'PK'
          : 'USD';
      setPriceMode(mode);
      setPk(editing.asking_pk != null ? String(editing.asking_pk) : '');
      setUsd(editing.asking_usd != null ? String(editing.asking_usd) : '');
      setTakeover(editing.account_takeover);
      setHighlights(editing.highlights || '');
      setContact(editing.seller_contact);
      setDiscord(editing.discord_handle || '');
    } else {
      setName('');
      setGuild('Warrior Mage');
      setRace('Human');
      setCircle('100');
      setPk('');
      setUsd('');
      setTakeover(true);
      setHighlights('');
      if (defaultContact) setContact(defaultContact);
      setDiscord('');
    }
  }, [editing, open]);

  useEffect(() => {
    if (defaultContact && !contact && !editing) setContact(defaultContact);
  }, [defaultContact]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    const pkVal = (priceMode === 'PK' || priceMode === 'Both') && pk ? Number(pk) : null;
    const usdVal = (priceMode === 'USD' || priceMode === 'Both') && usd ? Number(usd) : null;
    if (pkVal == null && usdVal == null) return;

    await onSubmit({
      character_name: name.trim() || null,
      guild,
      race: race.trim(),
      circle: Math.max(1, Number(circle) || 1),
      asking_pk: pkVal,
      asking_usd: usdVal,
      account_takeover: takeover,
      highlights: highlights.trim() || null,
      seller_contact: contact.trim(),
      discord_handle: discord.trim() || null,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-3.5 my-8">
        <h2 className="text-lg font-bold">{editing ? 'Edit Character Listing' : 'List Character for Sale'}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Character Name (optional)</label>
            <input type="text" placeholder="Leave blank if private" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Circle</label>
            <input type="number" min="1" required value={circle} onChange={(e) => setCircle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Guild</label>
            <select value={guild} onChange={(e) => setGuild(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm">
              {GUILDS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Race</label>
            <input type="text" required value={race} onChange={(e) => setRace(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Asking Price In</label>
          <div className="grid grid-cols-3 gap-2">
            {(['USD', 'PK', 'Both'] as const).map((mode) => (
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
                {mode === 'USD' ? '$ (USD)' : mode}
              </button>
            ))}
          </div>
        </div>

        {(priceMode === 'USD' || priceMode === 'Both') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Asking Price ($ USD)</label>
            <input type="number" step="any" min="0.01" required placeholder="e.g. 150" value={usd} onChange={(e) => setUsd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}

        {(priceMode === 'PK' || priceMode === 'Both') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Asking Price (PK)</label>
            <input type="number" step="any" min="0.01" required placeholder="e.g. 50000" value={pk} onChange={(e) => setPk(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" checked={takeover} onChange={(e) => setTakeover(e.target.checked)} />
          Full Account Takeover (uncheck for Character Transfer)
        </label>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Highlights (skills, TDs, gear, alters)</label>
          <textarea rows={3} placeholder="e.g. 600+ weaponry/defenses, 50 TDs, altered gear..." value={highlights} onChange={(e) => setHighlights(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seller Name</label>
            <input type="text" required placeholder="e.g. Kaelen" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Discord Handle (optional)</label>
            <input type="text" placeholder="e.g. kaelen_dr" value={discord} onChange={(e) => setDiscord(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer">
            {editing ? 'Save Changes' : 'Post Character'}
          </button>
        </div>
      </form>
    </div>
  );
}

type MarkCharSoldProps = {
  character: CharacterListing | null;
  onClose: () => void;
  onConfirm: (soldPk: number | null, soldUsd: number | null) => Promise<void>;
};

export function MarkCharacterSoldModal({ character, onClose, onConfirm }: MarkCharSoldProps) {
  const [pk, setPk] = useState('');
  const [usd, setUsd] = useState('');

  useEffect(() => {
    if (character) {
      setPk(character.asking_pk != null ? String(character.asking_pk) : '');
      setUsd(character.asking_usd != null ? String(character.asking_usd) : '');
    }
  }, [character]);

  if (!character) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkVal = pk ? Number(pk) : null;
    const usdVal = usd ? Number(usd) : null;
    if (pkVal == null && usdVal == null) return;
    await onConfirm(pkVal, usdVal);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">Record Character Sale</h2>
        <p className="text-xs text-slate-400">
          Enter the final sale price in PK, $ (USD), or both.
        </p>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Final Sold Price ($ USD)</label>
          <input type="number" step="any" min="0.01" placeholder="Optional if sold for PK" value={usd} onChange={(e) => setUsd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Final Sold Price (PK)</label>
          <input type="number" step="any" min="0.01" placeholder="Optional if sold for $" value={pk} onChange={(e) => setPk(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">Confirm Sold</button>
        </div>
      </form>
    </div>
  );
}
