-- Allow anonymous (unauthenticated) reads on verticals so ifood-pages
-- can resolve vertical slugs without auth credentials.
CREATE POLICY "Public can read verticals"
  ON verticals FOR SELECT
  TO anon
  USING (true);
