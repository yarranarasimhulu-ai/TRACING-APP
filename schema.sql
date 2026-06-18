CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
    id            UUID PRIMARY KEY,
    parent_run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    run_type      TEXT NOT NULL CHECK (run_type IN ('chain', 'llm', 'tool', 'agent', 'retriever', 'embedding')),
    inputs        JSONB NOT NULL DEFAULT '{}',
    outputs       JSONB,
    error         TEXT,
    status        TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ,
    tags          JSONB
);

CREATE INDEX IF NOT EXISTS idx_runs_project_id   ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_runs_parent_run_id ON runs(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_runs_start_time    ON runs(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_key       ON api_keys(key);
