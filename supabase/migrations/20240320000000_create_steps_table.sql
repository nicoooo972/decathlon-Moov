-- Create steps table
CREATE TABLE IF NOT EXISTS steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_steps INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_steps UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own steps"
    ON steps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own steps"
    ON steps FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own steps"
    ON steps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to get user steps
CREATE OR REPLACE FUNCTION get_user_steps()
RETURNS TABLE (
    total_steps INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT s.total_steps, s.last_updated
    FROM steps s
    WHERE s.user_id = auth.uid();
END;
$$; 