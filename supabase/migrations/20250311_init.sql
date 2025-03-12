-- Création de la table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des préférences utilisateurs
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'enfant')),
  activity_preferences TEXT[] NOT NULL,
  age_groups TEXT[] NOT NULL,
  max_distance_km NUMERIC NOT NULL DEFAULT 5,
  accessibility_needs BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des parcours
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  distance_km NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
  tags TEXT[] NOT NULL,
  image_url TEXT,
  start_point JSONB NOT NULL,
  end_point JSONB NOT NULL,
  waypoints JSONB[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des parcours favoris
CREATE TABLE IF NOT EXISTS favorite_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, route_id)
);

-- Création de la table des parcours complétés
CREATE TABLE IF NOT EXISTS completed_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  UNIQUE (user_id, route_id, completed_at)
);

-- Création des politiques de sécurité Row Level Security (RLS)

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_routes ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Politiques pour preferences
CREATE POLICY "Les utilisateurs peuvent voir leurs propres préférences" 
  ON preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres préférences" 
  ON preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres préférences" 
  ON preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Politiques pour routes
CREATE POLICY "Tout le monde peut voir les parcours" 
  ON routes FOR SELECT 
  USING (true);

-- Politiques pour favorite_routes
CREATE POLICY "Les utilisateurs peuvent voir leurs parcours favoris" 
  ON favorite_routes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent ajouter des parcours favoris" 
  ON favorite_routes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs parcours favoris" 
  ON favorite_routes FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques pour completed_routes
CREATE POLICY "Les utilisateurs peuvent voir leurs parcours complétés" 
  ON completed_routes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent ajouter des parcours complétés" 
  ON completed_routes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs parcours complétés" 
  ON completed_routes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Création de fonctions pour les déclencheurs

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheurs pour mettre à jour le timestamp updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur pour créer automatiquement un profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user(); 