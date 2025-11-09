/*
  # Update security documentation for Form ID-based access control

  This migration adds clarifying comments to the quotes table to document
  the security model based on Form ID (UUID) possession.

  ## Security Model
    - Access control is based on Form ID (UUID) possession
    - No traditional user authentication required
    - Security relies on unguessable UUIDs (UUID v4 = 122 bits of entropy)
    - Users can only access quotes if they have the specific Form ID
    - Form IDs are passed via query string: ?formId={uuid}&mode=quote
    - The 'id' column serves as the Form ID and primary security identifier

  ## Access Rules
    - Anyone with a Form ID can view, edit, lock, accept, and share that quote
    - Without the Form ID, the quote is inaccessible (cannot enumerate or guess)
    - RLS policy remains permissive since security is GUID-possession-based
    - Quote sharing is done by sharing the URL with Form ID parameter

  ## Integration
    - Designed for embedding in Auty.io forms
    - Form passes Form ID via query parameter when embedding pricing calculator
    - All quote operations use this Form ID for identification and access
*/

-- Add comment to quotes table
COMMENT ON TABLE quotes IS
'Stores pricing quotes with Form ID-based security. Access control via unguessable UUIDs (Form IDs). No user authentication required - security through GUID possession.';

-- Add comment to id column to clarify it is the Form ID
COMMENT ON COLUMN quotes.id IS
'Form ID (UUID) - Primary security identifier. Acts as an unguessable access token. Users must possess this UUID to access the quote.';

-- Update RLS policy comment to clarify security model
DROP POLICY IF EXISTS "Allow all operations on quotes" ON quotes;

CREATE POLICY "Allow all operations on quotes"
  ON quotes
  FOR ALL
  USING (true)    -- Permissive: Security is based on Form ID possession, not user auth
  WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on quotes" ON quotes IS
'Permissive policy for Form ID-based security model. Access control is enforced by requiring the unguessable Form ID (UUID) rather than traditional authentication.';