-- Création de la table des favoris
CREATE TABLE IF NOT EXISTS route_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Ajouter les politiques de sécurité RLS
ALTER TABLE route_favorites ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de lire leurs propres favoris
CREATE POLICY "Les utilisateurs peuvent lire leurs propres favoris"
ON route_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs d'ajouter leurs propres favoris
CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres favoris"
ON route_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres favoris
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres favoris"
ON route_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 