-- Job Requirements Table
CREATE TABLE IF NOT EXISTS job_requirements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    required_skills TEXT[] NOT NULL,
    nice_to_have TEXT[] NOT NULL,
    minimum_experience_years INTEGER NOT NULL,
    portfolio_required BOOLEAN NOT NULL DEFAULT false,
    github_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    email VARCHAR(500) UNIQUE NOT NULL,
    phone VARCHAR(50),
    github_url VARCHAR(1000),
    github_username VARCHAR(255),
    portfolio_url VARCHAR(1000),
    linkedin_url VARCHAR(1000),
    skills TEXT[] NOT NULL DEFAULT '{}',
    experience_years INTEGER NOT NULL DEFAULT 0,
    education TEXT,
    previous_roles TEXT[] NOT NULL DEFAULT '{}',
    raw_email_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(255) PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    cover_letter_summary TEXT,
    has_portfolio BOOLEAN NOT NULL DEFAULT false,
    cover_letter_is_generic BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    final_decision VARCHAR(50),
    rejection_reason TEXT,
    total_score INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMP,
    meet_link VARCHAR(1000),
    event_link VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Scores Table
CREATE TABLE IF NOT EXISTS scores (
    id VARCHAR(255) PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    breakdown JSONB NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_candidate_id ON scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scores_stage ON scores(stage);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    candidate_id VARCHAR(255) REFERENCES candidates(id) ON DELETE SET NULL,
    stage VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    decision VARCHAR(50),
    reasoning TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_candidate_id ON audit_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Webhook Config Table
CREATE TABLE IF NOT EXISTS webhook_configs (
    id VARCHAR(255) PRIMARY KEY,
    endpoint VARCHAR(1000) NOT NULL,
    secret VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);