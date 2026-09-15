CREATE TABLE IF NOT EXISTS migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS stories (
 id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, topics text[] NOT NULL,
 state text NOT NULL CHECK(state IN ('candidate','held','rejected','brief_released','article_review','published','merged','retracted')),
 revision integer NOT NULL DEFAULT 1, brief text NOT NULL DEFAULT '', article jsonb NOT NULL DEFAULT '{}',
 evidence jsonb NOT NULL DEFAULT '[]', evidence_label text NOT NULL DEFAULT 'Awaiting verification',
 major boolean NOT NULL DEFAULT false, synthetic boolean NOT NULL DEFAULT false,
 source_key text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 released_at timestamptz, published_at timestamptz, correction text NOT NULL DEFAULT '', merged_into uuid REFERENCES stories(id),
 CHECK(cardinality(topics) BETWEEN 1 AND 5), CHECK(topics <@ ARRAY['ai','coding','it-security','consumer-tech','tech-business']::text[])
);
CREATE TABLE IF NOT EXISTS revisions(id bigserial PRIMARY KEY, story_id uuid NOT NULL REFERENCES stories(id), revision integer NOT NULL, action text NOT NULL, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS subscribers (
 id uuid PRIMARY KEY, email text UNIQUE, email_state text NOT NULL DEFAULT 'off' CHECK(email_state IN ('off','unverified','active','suppressed')),
 chat_id text UNIQUE, telegram_state text NOT NULL DEFAULT 'off' CHECK(telegram_state IN ('off','pending','active','paused','blocked')),
 topics text[] NOT NULL, topic_since jsonb NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Kolkata',
 major_only boolean NOT NULL DEFAULT false, quiet_start text NOT NULL DEFAULT '', quiet_end text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), email_since timestamptz,
 CHECK(cardinality(topics) BETWEEN 1 AND 5), CHECK(topics <@ ARRAY['ai','coding','it-security','consumer-tech','tech-business']::text[])
);
CREATE TABLE IF NOT EXISTS sessions(hash text PRIMARY KEY, role text NOT NULL CHECK(role IN ('editor','subscriber')), subscriber_id uuid REFERENCES subscribers(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS tokens(hash text PRIMARY KEY, purpose text NOT NULL, subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS digests(id uuid PRIMARY KEY, subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE, local_date text NOT NULL, cutoff timestamptz NOT NULL, story_ids uuid[] NOT NULL, snapshot jsonb NOT NULL, UNIQUE(subscriber_id,local_date));
CREATE TABLE IF NOT EXISTS outbox(
 id uuid PRIMARY KEY, key text UNIQUE NOT NULL, subscriber_id uuid REFERENCES subscribers(id) ON DELETE CASCADE,
 story_id uuid REFERENCES stories(id), digest_id uuid REFERENCES digests(id) ON DELETE CASCADE,
 channel text NOT NULL CHECK(channel IN ('telegram','email','editor')), purpose text NOT NULL,
 payload jsonb NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','captured','accepted','failed','suppressed','ambiguous')),
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), leased_at timestamptz,
 provider_id text, error text, created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_due ON outbox(status,available_at);
CREATE TABLE IF NOT EXISTS sources(id text PRIMARY KEY, name text NOT NULL, url text NOT NULL, topics text[] NOT NULL, enabled boolean NOT NULL DEFAULT false, access_note text NOT NULL DEFAULT '', interval_minutes integer NOT NULL DEFAULT 30 CHECK(interval_minutes>=5), cursor jsonb, checked_at timestamptz, success_at timestamptz, error text);
CREATE TABLE IF NOT EXISTS settings(key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS telegram_updates(id bigint PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits(key text PRIMARY KEY, hits integer NOT NULL, resets_at timestamptz NOT NULL);
INSERT INTO settings VALUES ('switches','{"monitoring":true,"telegram":true,"email":true,"publishing":true,"editor":true}') ON CONFLICT DO NOTHING;
INSERT INTO migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS job_leases(name text PRIMARY KEY, owner uuid NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS email_budget(delivery_id uuid PRIMARY KEY, reserved_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS email_events(event_id text PRIMARY KEY, provider_id text NOT NULL, type text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO migrations(version) VALUES(2) ON CONFLICT DO NOTHING;
