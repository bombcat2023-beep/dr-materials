import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ws from 'ws';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

function guessTypeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.includes('wood') || lower.includes('bark') || lower.includes('log')) return 'Wood';
  if (lower.includes('stone') || lower.includes('granite') || lower.includes('marble') || lower.includes('obsidian') || lower.includes('onyx') || lower.includes('jade') || lower.includes('quartz')) return 'Stone';
  if (lower.includes('bone') || lower.includes('ivory') || lower.includes('horn') || lower.includes('antler')) return 'Bone';
  if (lower.includes('leather') || lower.includes('hide') || lower.includes('pelt') || lower.includes('skin') || lower.includes('scale')) return 'Leather';
  if (lower.includes('cloth') || lower.includes('silk') || lower.includes('wool') || lower.includes('linen') || lower.includes('weave') || lower.includes('burlap') || lower.includes('cotton') || lower.includes('felt')) return 'Cloth';
  if (lower.includes('sigil')) return 'Sigil';
  if (lower.includes('steel') || lower.includes('iron') || lower.includes('gold') || lower.includes('silver') || lower.includes('copper') || lower.includes('bronze') || lower.includes('brass') || lower.includes('tin') || lower.includes('zinc') || lower.includes('lead') || lower.includes('nickel') || lower.includes('pewter') || lower.includes('platinum') || lower.includes('orichalcum') || lower.includes('electrum') || lower.includes('tyrium') || lower.includes('kertig') || lower.includes('haralun') || lower.includes('glaes') || lower.includes('damite') || lower.includes('lumium') || lower.includes('animite') || lower.includes('coralite') || lower.includes('kelpzyte') || lower.includes('loimic') || lower.includes('niello') || lower.includes('niniam') || lower.includes('tomiek') || lower.includes('vardite') || lower.includes('agonite') || lower.includes('kadepa') || lower.includes('telothian')) return 'Metal';
  return 'Material';
}

async function seed() {
  console.log('Launching Chromium with desktop User-Agent...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let url = 'https://elanthipedia.play.net/index.php?title=Category:Crafting_materials';
  const materialsMap = new Map();

  while (url) {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Loaded page:', await page.title(), '| URL:', page.url());

    // Dismiss cookie banner if present
    await page.evaluate(() => {
      if (typeof ApplyPrivacyPreferences === 'function') {
        ApplyPrivacyPreferences();
      }
      const overlay = document.querySelector('#PrivacyPromptOverlay');
      if (overlay) overlay.remove();
    });

    // 1. Snag all headers (h3) and table material rows (first column of every wikitable)
    const tableItems = await page.evaluate(() => {
      const results = [];
      let currentType = 'Material';
      const skipHeaders = ['properties', 'sizes'];

      const nodes = document.querySelectorAll('#mw-content-text h3, #mw-content-text table tr');
      for (const el of nodes) {
        if (el.tagName === 'H3') {
          const h = el.innerText.toLowerCase();
          if (skipHeaders.some((s) => h.includes(s))) {
            currentType = 'SKIP';
          } else if (h.includes('metal')) currentType = 'Metal';
          else if (h.includes('wood')) currentType = 'Wood';
          else if (h.includes('stone')) currentType = 'Stone';
          else if (h.includes('bone')) currentType = 'Bone';
          else if (h.includes('cloth')) currentType = 'Cloth';
          else if (h.includes('leather')) currentType = 'Leather';
          else if (h.includes('plant')) currentType = 'Plant';
          else if (h.includes('sigil')) currentType = 'Sigil';
          else currentType = 'Material';
        } else if (el.tagName === 'TR' && currentType !== 'SKIP') {
          const firstCell = el.querySelector('td');
          if (firstCell) {
            const name = firstCell.innerText.trim();
            if (name) results.push({ name, type: currentType });
          }
        }
      }
      return results;
    });

    for (const item of tableItems) {
      const cleanName = item.name.replace(/\s*\([^)]+\)$/, '').trim();
      if (cleanName && !materialsMap.has(cleanName)) {
        materialsMap.set(cleanName, {
          name: cleanName,
          discipline: item.type,
          subcategory: item.type,
          rarity: 'Standard',
          unit_label: 'unit',
        });
      }
    }

    // 2. Also snag any category links in #mw-pages (A-Z listings)
    const categoryLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#mw-pages li a')).map((a) => a.innerText.trim());
    });

    for (const rawName of categoryLinks) {
      const cleanName = rawName.replace(/\s*\([^)]+\)$/, '').trim();
      if (cleanName && !materialsMap.has(cleanName)) {
        const type = guessTypeFromName(rawName);
        materialsMap.set(cleanName, {
          name: cleanName,
          discipline: type,
          subcategory: type,
          rarity: 'Standard',
          unit_label: 'unit',
        });
      }
    }

    // Check for "next page" link in #mw-pages
    const nextHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#mw-pages a'));
      const next = links.find((a) => a.innerText.trim().toLowerCase() === 'next page');
      return next ? next.href : null;
    });

    console.log(`Collected ${materialsMap.size} materials so far...`);
    url = nextHref;
  }

  await browser.close();

  const rows = Array.from(materialsMap.values());
  console.log(`Parsed ${rows.length} total materials. Upserting to Supabase...`);

  if (rows.length > 0) {
    const { error } = await supabase.from('materials').upsert(rows, { onConflict: 'name' });
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log(`Success! Seeded ${rows.length} materials into public.materials.`);
    }
  }
}

seed();
