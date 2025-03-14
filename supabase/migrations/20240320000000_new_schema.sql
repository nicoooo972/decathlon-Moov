-- Nouvelle structure de la base de données

-- Table principale des routes
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    distance_km NUMERIC(5, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
    activity_type TEXT NOT NULL,
    suitable_ages TEXT[] NOT NULL,
    accessibility BOOLEAN NOT NULL DEFAULT false,
    start_point JSONB NOT NULL,
    end_point JSONB NOT NULL,
    path_geom GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des locations (points d'intérêt, checkpoints, etc.)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('track_point', 'poi', 'checkpoint')),
    name TEXT,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation FLOAT,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    sequence_order INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des POIs
CREATE TABLE IF NOT EXISTS pois (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('activity', 'product', 'service')),
    description TEXT,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    contact_info JSONB,
    opening_hours JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des interactions utilisateurs avec les routes
CREATE TABLE IF NOT EXISTS user_route_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('completed', 'favorite', 'visited')),
    completed_at TIMESTAMPTZ,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    duration_minutes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, route_id, interaction_type)
);

-- Index pour améliorer les performances
CREATE INDEX idx_locations_route ON locations(route_id);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_pois_location ON pois(location_id);
CREATE INDEX idx_user_route_interactions ON user_route_interactions(user_id, route_id);
CREATE INDEX idx_routes_activity ON routes(activity_type);
CREATE INDEX idx_routes_difficulty ON routes(difficulty);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_route_interactions ENABLE ROW LEVEL SECURITY;

-- Routes policies
CREATE POLICY "Tout le monde peut voir les routes" 
    ON routes FOR SELECT 
    USING (true);

-- Locations policies
CREATE POLICY "Tout le monde peut voir les locations" 
    ON locations FOR SELECT 
    USING (true);

-- POIs policies
CREATE POLICY "Tout le monde peut voir les POIs" 
    ON pois FOR SELECT 
    USING (true);

-- User interactions policies
CREATE POLICY "Les utilisateurs peuvent voir leurs interactions" 
    ON user_route_interactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs interactions" 
    ON user_route_interactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs interactions" 
    ON user_route_interactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs interactions" 
    ON user_route_interactions FOR DELETE 
    USING (auth.uid() = user_id); 