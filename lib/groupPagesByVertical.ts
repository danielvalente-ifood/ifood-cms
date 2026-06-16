import type { Page, Vertical } from '@/types/database';

/** Página com a vertical resolvida (mesmo shape usado em home e /pages). */
export type PageWithVertical = Page & {
  vertical?: Vertical | null;
  creator?: { id?: string; full_name: string | null; avatar_url: string | null } | null;
  collaborators?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
};

export type PageGroup = {
  /** null = Ecossistema (páginas sem vertical) */
  vertical: Vertical | null;
  /** páginas do grupo — home primeiro, depois por updated_at desc */
  pages: PageWithVertical[];
  /** página marcada como home da vertical (ou null) */
  home: PageWithVertical | null;
};

const ECOSSISTEMA_KEY = '__ecossistema__';

/**
 * Agrupa páginas pela vertical (a vertical funciona como "projeto"/agrupador).
 * Páginas sem vertical caem no grupo "Ecossistema".
 * Dentro do grupo, a home vem primeiro; o restante por updated_at desc.
 * Os grupos são ordenados pela atividade mais recente (updated_at máximo).
 */
export function groupPagesByVertical(
  pages: PageWithVertical[],
  verticals: Vertical[]
): PageGroup[] {
  const verticalsMap = new Map(verticals.map((v) => [v.id, v]));
  const buckets = new Map<string, PageWithVertical[]>();

  for (const page of pages) {
    const key = page.vertical_id ?? ECOSSISTEMA_KEY;
    const list = buckets.get(key);
    if (list) list.push(page);
    else buckets.set(key, [page]);
  }

  const groups: PageGroup[] = [];
  for (const [key, list] of buckets) {
    const sorted = [...list].sort((a, b) => {
      if (a.is_home && !b.is_home) return -1;
      if (b.is_home && !a.is_home) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    groups.push({
      vertical: key === ECOSSISTEMA_KEY ? null : verticalsMap.get(key) ?? null,
      pages: sorted,
      home: sorted.find((p) => p.is_home) ?? null,
    });
  }

  // grupos ordenados pela atividade mais recente
  return groups.sort((a, b) => {
    const maxA = Math.max(...a.pages.map((p) => new Date(p.updated_at).getTime()));
    const maxB = Math.max(...b.pages.map((p) => new Date(p.updated_at).getTime()));
    return maxB - maxA;
  });
}
