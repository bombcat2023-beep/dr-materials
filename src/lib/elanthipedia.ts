/**
 * Converts a DragonRealms material name into its Elanthipedia URL.
 */

const wikiOverrides: Record<string, string> = {
  // Exceptions can be added here if wiki page names differ.
};

export function getElanthipediaUrl(materialName: string): string {
  const pageName =
    wikiOverrides[materialName] ?? materialName.replace(/ /g, '_');

  return `https://elanthipedia.play.net/${encodeURIComponent(pageName)}`;
}