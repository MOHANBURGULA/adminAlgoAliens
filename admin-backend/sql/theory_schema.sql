CREATE TABLE IF NOT EXISTS theory_resources (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'md')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theory_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  scroll_position DOUBLE PRECISION NOT NULL DEFAULT 0,
  percentage_completed DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_page INTEGER NULL,
  bookmark_scroll_position DOUBLE PRECISION NULL,
  bookmark_page INTEGER NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT theory_progress_user_module_unique UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_theory_resources_module_id
  ON theory_resources (module_id);

CREATE INDEX IF NOT EXISTS idx_theory_progress_module_id
  ON theory_progress (module_id);
