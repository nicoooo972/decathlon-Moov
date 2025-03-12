-- Fonction RPC pour créer un profil utilisateur avec les permissions appropriées
CREATE OR REPLACE FUNCTION create_profile_for_user(user_id UUID, user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec les permissions du propriétaire de la fonction
AS $$
BEGIN
  -- Vérifier si le profil existe déjà
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    -- Insérer le profil
    INSERT INTO profiles (id, email)
    VALUES (user_id, user_email);
  END IF;
END;
$$;

-- Accorder l'accès à la fonction à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_profile_for_user TO authenticated; 