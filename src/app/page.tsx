'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Plus, LogIn, LogOut, Package, Users, Mail, TrendingUp, Coins } from 'lucide-react';
import { MaterialStat, MaterialListing, CharacterListing, PlatListing } from '@/types/market';
import { MaterialsTab } from '@/components/MaterialsTab';
import { PriceIndexTab } from '@/components/PriceIndexTab';
import { CharactersTab } from '@/components/CharactersTab';
import { PlatsTab } from '@/components/PlatsTab';
import { ListMaterialModal, MarkSoldModal, EmailAuthModal } from '@/components/MarketModals';
import { ListCharacterModal, MarkCharacterSoldModal } from '@/components/CharacterModals';
import { ListPlatModal, MarkPlatSoldModal } from '@/components/PlatModals';

export default function DRMarketPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'prices' | 'characters' | 'plats'>('materials');

  const [stats, setStats] = useState<MaterialStat[]>([]);
  const [listings, setListings] = useState<MaterialListing[]>([]);
  const [characters, setCharacters] = useState<CharacterListing[]>([]);
  const [plats, setPlats] = useState<PlatListing[]>([]);

  const [showListMat, setShowListMat] = useState(false);
  const [showListChar, setShowListChar] = useState(false);
  const [showListPlat, setShowListPlat] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const [quickMatId, setQuickMatId] = useState<number | ''>('');
  const [soldTarget, setSoldTarget] = useState<MaterialListing | null>(null);
  const [soldCharTarget, setSoldCharTarget] = useState<CharacterListing | null>(null);
  const [soldPlatTarget, setSoldPlatTarget] = useState<PlatListing | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadAll = async () => {
    const [{ data: s }, { data: l }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('material_price_stats').select('*').order('name'),
      supabase.from('material_listings').select('*').order('created_at', { ascending: false }),
      supabase.from('character_listings').select('*').order('created_at', { ascending: false }),
      supabase.from('plat_listings').select('*').order('created_at', { ascending: false }),
    ]);
    if (s) setStats(s);
    if (l) setListings(l);
    if (c) setCharacters(c);
    if (p) setPlats(p);
  };

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    loadAll();
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  };

  const defaultContact = user?.user_metadata?.full_name || '';
  if (!mounted) return null;

  const discordIdentity = user?.identities?.find((i: any) => i.provider === 'discord');
  const sellerDiscordId = discordIdentity?.id || user?.user_metadata?.provider_id || null;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-amber-400">
              DragonRealms Trade &amp; Price Index
            </h1>
            <p className="text-xs text-slate-400">
              Live PK &amp; USD running averages across {stats.length} materials
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => { setQuickMatId(''); setShowListMat(true); }}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3.5 py-2 rounded-lg text-sm cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  List Material
                </button>
                <button
                  type="button"
                  onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm cursor-pointer transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowEmailAuth(true)}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium px-3.5 py-2 rounded-lg text-sm cursor-pointer transition"
                >
                  <Mail className="w-4 h-4" />
                  Sign in with Email
                </button>
                <button
                  type="button"
                  onClick={signInWithDiscord}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-2 rounded-lg text-sm cursor-pointer transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in with Discord
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 flex gap-6 border-t border-slate-800/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`py-3 text-sm font-medium border-b-2 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'materials'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Marketplace ({stats.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prices')}
            className={`py-3 text-sm font-medium border-b-2 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'prices'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Price Index &amp; Charts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`py-3 text-sm font-medium border-b-2 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'characters'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Character Sales ({characters.filter((c) => c.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plats')}
            className={`py-3 text-sm font-medium border-b-2 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'plats'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            Plats for Sale ({plats.filter((p) => p.status === 'active').length})
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'materials' && (
          <MaterialsTab
            stats={stats}
            listings={listings}
            userId={user?.id}
            onListMaterial={(id) => { setQuickMatId(id ?? ''); setShowListMat(true); }}
            onMarkSold={(listing) => setSoldTarget(listing)}
          />
        )}
        {activeTab === 'prices' && (
          <PriceIndexTab stats={stats} listings={listings} />
        )}
        {activeTab === 'characters' && (
          <CharactersTab
            characters={characters}
            userId={user?.id}
            onListCharacter={() => setShowListChar(true)}
            onMarkSold={(char) => setSoldCharTarget(char)}
          />
        )}
        {activeTab === 'plats' && (
          <PlatsTab
            plats={plats}
            userId={user?.id}
            onListPlat={() => setShowListPlat(true)}
            onMarkSold={(plat) => setSoldPlatTarget(plat)}
          />
        )}
      </main>

      <EmailAuthModal
        open={showEmailAuth}
        supabase={supabase}
        onClose={() => setShowEmailAuth(false)}
        onSuccess={loadAll}
      />

      <ListMaterialModal
        open={showListMat}
        stats={stats}
        initialMatId={quickMatId}
        defaultContact={defaultContact}
        onClose={() => setShowListMat(false)}
        onSubmit={async (payload) => {
          const { error } = await supabase
            .from('material_listings')
            .insert({ seller_id: user.id, seller_discord_id: sellerDiscordId, ...payload });
          if (error) return alert(error.message);
          setShowListMat(false);
          await loadAll();
        }}
      />

      <MarkSoldModal
        listing={soldTarget}
        onClose={() => setSoldTarget(null)}
        onConfirm={async (soldKronars, soldUsd) => {
          if (!soldTarget) return;
          await supabase
            .from('material_listings')
            .update({
              status: 'sold',
              sold_unit_price: soldKronars ?? soldUsd ?? 1,
              sold_kronars: soldKronars,
              sold_usd: soldUsd,
              sold_at: new Date().toISOString(),
            })
            .eq('id', soldTarget.id);
          setSoldTarget(null);
          await loadAll();
        }}
      />

      <ListCharacterModal
        open={showListChar}
        defaultContact={defaultContact}
        onClose={() => setShowListChar(false)}
        onSubmit={async (payload) => {
          const { error } = await supabase
            .from('character_listings')
            .insert({ seller_id: user.id, seller_discord_id: sellerDiscordId, ...payload });
          if (error) return alert(error.message);
          setShowListChar(false);
          await loadAll();
        }}
      />

      <MarkCharacterSoldModal
        character={soldCharTarget}
        onClose={() => setSoldCharTarget(null)}
        onConfirm={async (soldPk, soldUsd) => {
          if (!soldCharTarget) return;
          await supabase
            .from('character_listings')
            .update({
              status: 'sold',
              sold_pk: soldPk,
              sold_usd: soldUsd,
              sold_at: new Date().toISOString(),
            })
            .eq('id', soldCharTarget.id);
          setSoldCharTarget(null);
          await loadAll();
        }}
      />

      <ListPlatModal
        open={showListPlat}
        defaultContact={defaultContact}
        onClose={() => setShowListPlat(false)}
        onSubmit={async (payload) => {
          const { error } = await supabase
            .from('plat_listings')
            .insert({ seller_id: user.id, seller_discord_id: sellerDiscordId, ...payload });
          if (error) return alert(error.message);
          setShowListPlat(false);
          await loadAll();
        }}
      />

      <MarkPlatSoldModal
        plat={soldPlatTarget}
        onClose={() => setSoldPlatTarget(null)}
        onConfirm={async (soldRatePer1k) => {
          if (!soldPlatTarget) return;
          await supabase
            .from('plat_listings')
            .update({
              status: 'sold',
              sold_usd_per_1k: soldRatePer1k,
              sold_at: new Date().toISOString(),
            })
            .eq('id', soldPlatTarget.id);
          setSoldPlatTarget(null);
          await loadAll();
        }}
      />
    </div>
  );
}
