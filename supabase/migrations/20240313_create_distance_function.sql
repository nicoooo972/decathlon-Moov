-- Fonction pour calculer la distance entre deux points géographiques en utilisant la formule de Haversine
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lng1 FLOAT,
  lat2 FLOAT,
  lng2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
  r FLOAT := 6371; -- Rayon de la Terre en kilomètres
  dLat FLOAT := radians(lat2 - lat1);
  dLng FLOAT := radians(lng2 - lng1);
  a FLOAT;
  c FLOAT;
  d FLOAT;
BEGIN
  a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLng/2) * sin(dLng/2);
  c := 2 * asin(sqrt(a));
  d := r * c;
  RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les routes à une distance maximale donnée
CREATE OR REPLACE FUNCTION get_routes_within_distance(
  user_lat FLOAT,
  user_lng FLOAT,
  max_distance_km FLOAT
) RETURNS SETOF routes AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM routes r,
       jsonb_to_record(r.start_point) AS point(lat float, lng float)
  WHERE calculate_distance(user_lat, user_lng, point.lat, point.lng) <= max_distance_km
  ORDER BY calculate_distance(user_lat, user_lng, point.lat, point.lng);
END;
$$ LANGUAGE plpgsql; 