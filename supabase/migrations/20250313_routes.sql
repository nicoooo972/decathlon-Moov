-- Mise à jour de la table des parcours
-- D'abord, supprimons la table existante si elle existe
DROP TABLE IF EXISTS routes CASCADE;

-- Création de la table des parcours avec la nouvelle structure
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
  waypoints JSONB[] NOT NULL DEFAULT '{}',
  points_of_interest JSONB[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des produits recommandés
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(10, 2) NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table de liaison entre points d'intérêt et produits
CREATE TABLE IF NOT EXISTS route_point_products (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  point_index INTEGER NOT NULL, -- Index du point dans le tableau points_of_interest
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(route_id, point_index, product_id)
);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp updated_at sur les routes
CREATE TRIGGER update_routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le timestamp updated_at sur les produits
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Ajouter des exemples de parcours
INSERT INTO routes (
  name, 
  description, 
  distance_km, 
  duration_minutes, 
  difficulty, 
  activity_type, 
  suitable_ages, 
  accessibility, 
  start_point, 
  end_point, 
  waypoints, 
  points_of_interest, 
  image_url
) VALUES (
  'Parcours historique du Marais',
  'Découvrez l''histoire fascinante du quartier du Marais à travers ce parcours qui vous fera voyager dans le temps, du Moyen Âge à nos jours.',
  3.5,
  90,
  'facile',
  'histoire',
  ARRAY['enfant', 'adolescent', 'adulte'],
  true,
  '{"lat": 48.856614, "lng": 2.352222}'::jsonb,
  '{"lat": 48.860611, "lng": 2.362222}'::jsonb,
  ARRAY['{"lat": 48.857614, "lng": 2.354222}'::jsonb, '{"lat": 48.858614, "lng": 2.356222}'::jsonb, '{"lat": 48.859614, "lng": 2.358222}'::jsonb],
  ARRAY['{"position": {"lat": 48.857614, "lng": 2.354222}, "name": "Place des Vosges", "description": "La plus ancienne place de Paris, construite entre 1605 et 1612.", "image_url": "/images/place-des-vosges.jpg"}'::jsonb, '{"position": {"lat": 48.858614, "lng": 2.356222}, "name": "Musée Carnavalet", "description": "Musée consacré à l''histoire de Paris, installé dans deux hôtels particuliers.", "image_url": "/images/musee-carnavalet.jpg"}'::jsonb, '{"position": {"lat": 48.859614, "lng": 2.358222}, "name": "Rue des Rosiers", "description": "Cœur historique du quartier juif de Paris, avec ses nombreuses boutiques et restaurants.", "image_url": "/images/rue-des-rosiers.jpg"}'::jsonb],
  '/images/routes/marais.jpg'
),
(
  'Balade nature au Bois de Vincennes',
  'Une escapade verte en plein Paris ! Ce parcours vous fera découvrir les plus beaux coins du Bois de Vincennes, le plus grand espace vert de la capitale.',
  5.2,
  120,
  'moyen',
  'nature',
  ARRAY['tout-petit', 'enfant', 'adolescent', 'adulte'],
  true,
  '{"lat": 48.834517, "lng": 2.411253}'::jsonb,
  '{"lat": 48.842517, "lng": 2.421253}'::jsonb,
  ARRAY['{"lat": 48.836517, "lng": 2.413253}'::jsonb, '{"lat": 48.838517, "lng": 2.415253}'::jsonb, '{"lat": 48.840517, "lng": 2.417253}'::jsonb],
  ARRAY['{"position": {"lat": 48.836517, "lng": 2.413253}, "name": "Lac Daumesnil", "description": "Magnifique lac avec des îles accessibles par des ponts pittoresques.", "image_url": "/images/lac-daumesnil.jpg"}'::jsonb, '{"position": {"lat": 48.838517, "lng": 2.415253}, "name": "Parc Floral", "description": "Jardin botanique avec de nombreuses espèces de fleurs et plantes.", "image_url": "/images/parc-floral.jpg"}'::jsonb, '{"position": {"lat": 48.840517, "lng": 2.417253}, "name": "Château de Vincennes", "description": "Imposante forteresse médiévale avec son donjon et sa Sainte-Chapelle.", "image_url": "/images/chateau-vincennes.jpg"}'::jsonb],
  '/images/routes/bois-vincennes.jpg'
),
(
  'Parcours sportif Canal Saint-Martin',
  'Un itinéraire dynamique le long du Canal Saint-Martin, idéal pour combiner activité physique et découverte urbaine.',
  4.0,
  60,
  'facile',
  'sport',
  ARRAY['adolescent', 'adulte'],
  true,
  '{"lat": 48.870031, "lng": 2.360828}'::jsonb,
  '{"lat": 48.879031, "lng": 2.370828}'::jsonb,
  ARRAY['{"lat": 48.872031, "lng": 2.362828}'::jsonb, '{"lat": 48.874031, "lng": 2.364828}'::jsonb, '{"lat": 48.876031, "lng": 2.366828}'::jsonb],
  ARRAY['{"position": {"lat": 48.872031, "lng": 2.362828}, "name": "Écluses du canal", "description": "Observez le fonctionnement des écluses qui permettent aux bateaux de naviguer sur le canal.", "image_url": "/images/ecluses-canal.jpg"}'::jsonb, '{"position": {"lat": 48.874031, "lng": 2.364828}, "name": "Terrain de basket", "description": "Faites une pause sportive sur ce terrain de basket en plein air.", "image_url": "/images/terrain-basket.jpg"}'::jsonb, '{"position": {"lat": 48.876031, "lng": 2.366828}, "name": "Parc de la Villette", "description": "Plus grand parc culturel urbain de Paris avec de nombreuses installations sportives.", "image_url": "/images/parc-villette.jpg"}'::jsonb],
  '/images/routes/canal-saint-martin.jpg'
);

-- Ajouter des exemples de produits
INSERT INTO products (
  name,
  description,
  image_url,
  price,
  url,
  category
) VALUES (
  'Chaussures de randonnée Quechua NH100',
  'Chaussures confortables et imperméables, parfaites pour la marche en ville ou en nature.',
  '/images/products/chaussures-randonnee.jpg',
  29.99,
  'https://www.decathlon.fr/p/chaussures-de-randonnee-nh100/_/R-p-308943',
  'chaussures'
),
(
  'Gourde isotherme 500ml',
  'Gardez vos boissons fraîches pendant 12h ou chaudes pendant 6h.',
  '/images/products/gourde-isotherme.jpg',
  12.99,
  'https://www.decathlon.fr/p/gourde-isotherme-randonnee/_/R-p-302304',
  'accessoires'
),
(
  'Sac à dos 20L',
  'Compact et léger, idéal pour les balades urbaines ou les petites randonnées.',
  '/images/products/sac-a-dos.jpg',
  19.99,
  'https://www.decathlon.fr/p/sac-a-dos-de-randonnee-nh100-20-litres/_/R-p-309812',
  'bagagerie'
),
(
  'Ballon de basket',
  'Ballon de basket taille 7, adapté pour jouer en extérieur.',
  '/images/products/ballon-basket.jpg',
  14.99,
  'https://www.decathlon.fr/p/ballon-de-basket-tarmak-500-taille-7/_/R-p-302303',
  'sports collectifs'
),
(
  'Raquettes de ping-pong',
  'Set de 2 raquettes et 3 balles pour jouer au ping-pong en extérieur.',
  '/images/products/raquettes-ping-pong.jpg',
  9.99,
  'https://www.decathlon.fr/p/set-de-2-raquettes-et-3-balles-de-tennis-de-table-fr-130/_/R-p-305513',
  'sports de raquette'
);

-- Ajouter des associations entre points d'intérêt et produits
INSERT INTO route_point_products (route_id, point_index, product_id) VALUES
(1, 0, 1), -- Place des Vosges - Chaussures de randonnée
(1, 0, 2), -- Place des Vosges - Gourde isotherme
(1, 1, 3), -- Musée Carnavalet - Sac à dos
(2, 0, 1), -- Lac Daumesnil - Chaussures de randonnée
(2, 0, 2), -- Lac Daumesnil - Gourde isotherme
(2, 1, 3), -- Parc Floral - Sac à dos
(3, 1, 4), -- Terrain de basket - Ballon de basket
(3, 2, 5); -- Parc de la Villette - Raquettes de ping-pong

-- Ajouter les politiques de sécurité RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_point_products ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les parcours
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les parcours"
ON routes FOR SELECT
TO authenticated
USING (true);

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les produits
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les produits"
ON products FOR SELECT
TO authenticated
USING (true);

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les associations
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les associations"
ON route_point_products FOR SELECT
TO authenticated
USING (true); 