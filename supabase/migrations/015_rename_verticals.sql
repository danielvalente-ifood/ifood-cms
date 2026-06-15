-- Migration 015: Rename verticals to new brand names
-- iFood Ecossistema, iFood Pago, iFood Salão, iFood Ads, iFood Logística

UPDATE verticals SET name = 'iFood Ecossistema' WHERE slug = 'delivery';
UPDATE verticals SET name = 'iFood Salão'       WHERE slug = 'salao';
UPDATE verticals SET name = 'iFood Pago'         WHERE slug = 'ifood-pago';
UPDATE verticals SET name = 'iFood Ads'          WHERE slug = 'ads';
UPDATE verticals SET name = 'iFood Logística'    WHERE slug = 'logistica';
