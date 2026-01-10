-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read approved feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated can read all" ON feedback;
DROP POLICY IF EXISTS "Authenticated can update" ON feedback;
DROP POLICY IF EXISTS "Authenticated can delete" ON feedback;

-- Policy: Public (anon) can read approved feedback only
CREATE POLICY "Public can read approved feedback"
  ON feedback
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Policy: Public (anon) can insert new feedback
CREATE POLICY "Public can submit feedback"
  ON feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated users have full access
CREATE POLICY "Authenticated full access"
  ON feedback
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
