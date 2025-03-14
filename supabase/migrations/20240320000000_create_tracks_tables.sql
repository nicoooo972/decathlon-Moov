-- Create tracks table
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    distance FLOAT,
    duration INTERVAL,
    average_speed FLOAT,
    max_speed FLOAT,
    elevation_gain FLOAT,
    elevation_loss FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create track points table
CREATE TABLE track_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation FLOAT,
    speed FLOAT,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tracks_user_id ON tracks(user_id);
CREATE INDEX idx_tracks_route_id ON tracks(route_id);
CREATE INDEX idx_track_points_track_id ON track_points(track_id);
CREATE INDEX idx_track_points_time ON track_points(time);

-- Add RLS policies
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_points ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tracks
CREATE POLICY "Users can view their own tracks"
    ON tracks FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own tracks
CREATE POLICY "Users can insert their own tracks"
    ON tracks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tracks
CREATE POLICY "Users can update their own tracks"
    ON tracks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tracks
CREATE POLICY "Users can delete their own tracks"
    ON tracks FOR DELETE
    USING (auth.uid() = user_id);

-- Track points policies
CREATE POLICY "Users can view their track points"
    ON track_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tracks
        WHERE tracks.id = track_points.track_id
        AND tracks.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their track points"
    ON track_points FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tracks
        WHERE tracks.id = track_points.track_id
        AND tracks.user_id = auth.uid()
    ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tracks
CREATE TRIGGER update_tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 