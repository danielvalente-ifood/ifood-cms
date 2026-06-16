-- 016_pages_is_home.sql
-- Marca uma página como "home" da vertical. As demais páginas da mesma
-- vertical são tratadas como subpáginas. Agrupamento usa o vertical_id já
-- existente — a vertical funciona como "projeto"/agrupador.

ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_home BOOLEAN NOT NULL DEFAULT false;

-- No máximo uma home por vertical (apenas para vertical_id não nulo).
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_one_home_per_vertical
  ON pages (vertical_id) WHERE is_home = true AND vertical_id IS NOT NULL;
