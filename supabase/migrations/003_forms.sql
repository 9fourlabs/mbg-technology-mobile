-- ============================================================================
-- Migration 003: Forms Template
-- Table for dynamic form submissions with review workflow
-- ============================================================================

CREATE TABLE form_submissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users (id),
  form_id     TEXT        NOT NULL,
  data        JSONB       NOT NULL DEFAULT '{}',
  status      TEXT        NOT NULL DEFAULT 'submitted'
                          CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected')),
  attachments TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_submissions_user_id ON form_submissions (user_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions (form_id);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own form submissions
CREATE POLICY "form_submissions_all_own"
  ON form_submissions FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
