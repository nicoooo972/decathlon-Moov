-- Création de la table des visites utilisateur
CREATE TABLE IF NOT EXISTS user_visits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poi_id BIGINT REFERENCES points_of_interest(id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, poi_id)
);

-- Création de la table des favoris utilisateur
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poi_id BIGINT REFERENCES points_of_interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, poi_id)
);

-- Création de la table des parcours complétés
CREATE TABLE IF NOT EXISTS user_completed_routes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id BIGINT REFERENCES routes(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  UNIQUE(user_id, route_id)
);

-- Création d'une fonction pour marquer un point d'intérêt comme visité
CREATE OR REPLACE FUNCTION mark_poi_as_visited(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
) RETURNS BOOLEAN AS $$
DECLARE
  v_poi_id BIGINT;
  v_tolerance DOUBLE PRECISION := 0.001; -- Tolérance pour la comparaison des coordonnées
BEGIN
  -- Trouver le point d'intérêt correspondant aux coordonnées
  SELECT id INTO v_poi_id
  FROM points_of_interest
  WHERE 
    latitude BETWEEN p_latitude - v_tolerance AND p_latitude + v_tolerance
    AND longitude BETWEEN p_longitude - v_tolerance AND p_longitude + v_tolerance
  LIMIT 1;
  
  -- Si aucun point d'intérêt n'est trouvé, retourner false
  IF v_poi_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insérer ou mettre à jour la visite
  INSERT INTO user_visits (user_id, poi_id)
  VALUES (p_user_id, v_poi_id)
  ON CONFLICT (user_id, poi_id) 
  DO UPDATE SET visited_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création d'une fonction pour ajouter/supprimer un favori
CREATE OR REPLACE FUNCTION toggle_poi_favorite(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
) RETURNS BOOLEAN AS $$
DECLARE
  v_poi_id BIGINT;
  v_tolerance DOUBLE PRECISION := 0.001; -- Tolérance pour la comparaison des coordonnées
  v_exists BOOLEAN;
BEGIN
  -- Trouver le point d'intérêt correspondant aux coordonnées
  SELECT id INTO v_poi_id
  FROM points_of_interest
  WHERE 
    latitude BETWEEN p_latitude - v_tolerance AND p_latitude + v_tolerance
    AND longitude BETWEEN p_longitude - v_tolerance AND p_longitude + v_tolerance
  LIMIT 1;
  
  -- Si aucun point d'intérêt n'est trouvé, retourner false
  IF v_poi_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si le favori existe déjà
  SELECT EXISTS (
    SELECT 1 FROM user_favorites
    WHERE user_id = p_user_id AND poi_id = v_poi_id
  ) INTO v_exists;
  
  -- Si le favori existe, le supprimer, sinon l'ajouter
  IF v_exists THEN
    DELETE FROM user_favorites
    WHERE user_id = p_user_id AND poi_id = v_poi_id;
    RETURN FALSE; -- Indique que le favori a été supprimé
  ELSE
    INSERT INTO user_favorites (user_id, poi_id)
    VALUES (p_user_id, v_poi_id);
    RETURN TRUE; -- Indique que le favori a été ajouté
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création d'une fonction pour marquer un parcours comme complété
CREATE OR REPLACE FUNCTION mark_route_as_completed(
  p_user_id UUID,
  p_route_id BIGINT,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insérer ou mettre à jour le parcours complété
  INSERT INTO user_completed_routes (user_id, route_id, duration_minutes)
  VALUES (p_user_id, p_route_id, p_duration_minutes)
  ON CONFLICT (user_id, route_id) 
  DO UPDATE SET 
    completed_at = NOW(),
    duration_minutes = p_duration_minutes;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création des politiques RLS pour les tables
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_completed_routes ENABLE ROW LEVEL SECURITY;

-- Politique pour les visites : un utilisateur ne peut voir que ses propres visites
CREATE POLICY user_visits_policy ON user_visits
  FOR ALL
  USING (auth.uid() = user_id);

-- Politique pour les favoris : un utilisateur ne peut voir que ses propres favoris
CREATE POLICY user_favorites_policy ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id);

-- Politique pour les parcours complétés : un utilisateur ne peut voir que ses propres parcours
CREATE POLICY user_completed_routes_policy ON user_completed_routes
  FOR ALL
  USING (auth.uid() = user_id); 