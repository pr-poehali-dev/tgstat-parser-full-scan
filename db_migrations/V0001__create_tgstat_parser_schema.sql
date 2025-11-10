-- TGStat Parser Database Schema

-- Table: scan_jobs
-- Stores information about scanning tasks
CREATE TABLE IF NOT EXISTS scan_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(200) NOT NULL,
    tag VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    progress INTEGER DEFAULT 0,
    channels_found INTEGER DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: channels
-- Stores parsed Telegram channel data
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100),
    channel_id VARCHAR(200) UNIQUE,
    title VARCHAR(500) NOT NULL,
    link VARCHAR(500) NOT NULL,
    description TEXT,
    subscribers INTEGER DEFAULT 0,
    tgstat_url VARCHAR(500),
    screenshot_path VARCHAR(500),
    raw_html_path VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: channel_tags
-- Many-to-many relationship for channel tags
CREATE TABLE IF NOT EXISTS channel_tags (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: channel_admins
-- Stores admin information for channels
CREATE TABLE IF NOT EXISTS channel_admins (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER,
    admin_name VARCHAR(200),
    admin_link VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: security_scans
-- Stores security scan results
CREATE TABLE IF NOT EXISTS security_scans (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    has_cloudflare BOOLEAN DEFAULT FALSE,
    has_captcha BOOLEAN DEFAULT FALSE,
    rate_limit INTEGER,
    robots_txt_allowed BOOLEAN,
    js_challenge_detected BOOLEAN DEFAULT FALSE,
    scan_result JSONB,
    scanned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: export_history
-- Tracks Excel file exports with checksums
CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) UNIQUE NOT NULL,
    job_id VARCHAR(100),
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT,
    row_count INTEGER,
    sha256_checksum VARCHAR(64),
    exported_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_created ON scan_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_job_id ON channels(job_id);
CREATE INDEX IF NOT EXISTS idx_channels_subscribers ON channels(subscribers DESC);
CREATE INDEX IF NOT EXISTS idx_channel_tags_tag ON channel_tags(tag);
CREATE INDEX IF NOT EXISTS idx_export_history_job_id ON export_history(job_id);
