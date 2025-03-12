-- Création de la table des points d'intérêt
CREATE TABLE IF NOT EXISTS points_of_interest (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT NOT NULL,
  opening_hours TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table pour les détails des points d'intérêt
CREATE TABLE IF NOT EXISTS poi_details (
  id BIGSERIAL PRIMARY KEY,
  poi_id BIGINT REFERENCES points_of_interest(id) ON DELETE CASCADE,
  detail TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table pour les activités des points d'intérêt
CREATE TABLE IF NOT EXISTS poi_activities (
  id BIGSERIAL PRIMARY KEY,
  poi_id BIGINT REFERENCES points_of_interest(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table pour les produits recommandés
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table de liaison entre points d'intérêt et produits
CREATE TABLE IF NOT EXISTS poi_products (
  id BIGSERIAL PRIMARY KEY,
  poi_id BIGINT REFERENCES points_of_interest(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poi_id, product_id)
);

-- Ajout d'un trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_points_of_interest_updated_at
BEFORE UPDATE ON points_of_interest
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poi_details_updated_at
BEFORE UPDATE ON poi_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poi_activities_updated_at
BEFORE UPDATE ON poi_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poi_products_updated_at
BEFORE UPDATE ON poi_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données pour la Tour Eiffel
INSERT INTO points_of_interest (name, description, latitude, longitude, image_url, opening_hours, website)
VALUES (
  'Tour Eiffel',
  'La Tour Eiffel est une tour de fer puddlé de 330 m de hauteur située à Paris, à l''extrémité nord-ouest du parc du Champ-de-Mars en bordure de la Seine dans le 7e arrondissement. Construite par Gustave Eiffel et ses collaborateurs pour l''Exposition universelle de Paris de 1889, et initialement nommée « tour de 300 mètres », ce monument est devenu le symbole de la capitale française.',
  48.8584,
  2.2945,
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
  'Tous les jours de 9h30 à 23h45 (dernier accès à 23h)',
  'https://www.toureiffel.paris/fr'
);

-- Récupérer l'ID de la Tour Eiffel
DO $$
DECLARE
  eiffel_id BIGINT;
BEGIN
  SELECT id INTO eiffel_id FROM points_of_interest WHERE name = 'Tour Eiffel';
  
  -- Insertion des détails pour la Tour Eiffel
  INSERT INTO poi_details (poi_id, detail) VALUES
    (eiffel_id, 'Hauteur: 330 mètres'),
    (eiffel_id, 'Construction: 1887-1889'),
    (eiffel_id, 'Architecte: Gustave Eiffel'),
    (eiffel_id, 'Poids: 10 100 tonnes'),
    (eiffel_id, 'Visiteurs: 7 millions par an');
  
  -- Insertion des activités pour la Tour Eiffel
  INSERT INTO poi_activities (poi_id, activity) VALUES
    (eiffel_id, 'Montée au sommet pour une vue panoramique de Paris'),
    (eiffel_id, 'Dîner au restaurant gastronomique Le Jules Verne'),
    (eiffel_id, 'Visite du 1er étage avec son plancher de verre'),
    (eiffel_id, 'Découverte de l''histoire de la tour au 2ème étage'),
    (eiffel_id, 'Admirer le scintillement nocturne toutes les heures');
  
  -- Insertion des produits recommandés
  INSERT INTO products (name, image_url, price, url, category) VALUES
    ('Chaussures de randonnée légères', 'https://contents.mediadecathlon.com/p2397366/k$f7374f04fb8fb3f7c9e4c5f5e9ecbcb4/sq/chaussures-impermeables-de-randonnee-nature-nh150-wp-homme.jpg', 59.99, 'https://www.decathlon.fr/p/chaussures-impermeables-de-randonnee-nature-nh150-wp-homme/_/R-p-325283', 'Chaussures'),
    ('Gourde randonnée 900', 'https://contents.mediadecathlon.com/p1575264/k$5d1cdb8e5a72b9a1b0d7b2d4a3fb0d3e/sq/gourde-randonnee-900-bouchon-instantane-avec-pipette-08l-aluminium.jpg', 9.99, 'https://www.decathlon.fr/p/gourde-randonnee-900-bouchon-instantane-avec-pipette-0-8l-aluminium/_/R-p-302871', 'Accessoires'),
    ('Sac à dos de randonnée 10L', 'https://contents.mediadecathlon.com/p2153574/k$f0b275c5beb62c62c9896a5e1ce2da41/sq/sac-a-dos-de-randonnee-nature-nh-arpenaz-10l.jpg', 24.99, 'https://www.decathlon.fr/p/sac-a-dos-de-randonnee-nature-nh-arpenaz-10l/_/R-p-334326', 'Sacs');
  
  -- Liaison entre la Tour Eiffel et les produits
  INSERT INTO poi_products (poi_id, product_id)
  SELECT eiffel_id, id FROM products WHERE name IN ('Chaussures de randonnée légères', 'Gourde randonnée 900', 'Sac à dos de randonnée 10L');
END $$; 