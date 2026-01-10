-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('general', 'neighbourhood')),
  neighbourhood_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_tag VARCHAR(20) CHECK (moderator_tag IN ('implemented', 'planned', 'noted', 'wont_fix')),
  moderator_reply TEXT,
  moderated_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_neighbourhood ON feedback(neighbourhood_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved feedback
CREATE POLICY "Anyone can read approved feedback"
  ON feedback
  FOR SELECT
  USING (status = 'approved');

-- Policy: Anyone can insert new feedback (always as pending)
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (status = 'pending');

-- Policy: Authenticated users can read all feedback
CREATE POLICY "Authenticated can read all"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update feedback
CREATE POLICY "Authenticated can update"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can delete feedback
CREATE POLICY "Authenticated can delete"
  ON feedback
  FOR DELETE
  TO authenticated
  USING (true);
