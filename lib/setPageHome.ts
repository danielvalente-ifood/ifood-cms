import { supabase } from '@/lib/supabase';

/**
 * Define `pageId` como a home da sua vertical, garantindo que exista no
 * máximo uma home por vertical (desmarca as demais antes). Enforcement em
 * app-level para evitar erro do índice único parcial em updates concorrentes.
 *
 * Para páginas sem vertical (Ecossistema) o conceito de home não se aplica —
 * a função apenas marca a própria página (sem desmarcar outras).
 */
export async function setPageHome(
  pageId: string,
  verticalId: string | null
): Promise<{ error: unknown }> {
  if (verticalId) {
    const { error: unsetError } = await supabase
      .from('pages')
      .update({ is_home: false })
      .eq('vertical_id', verticalId)
      .eq('is_home', true);
    if (unsetError) return { error: unsetError };
  }

  const { error } = await supabase
    .from('pages')
    .update({ is_home: true })
    .eq('id', pageId);

  return { error };
}
