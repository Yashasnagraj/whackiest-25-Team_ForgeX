-- ============================================================
-- TRIP CHAT - Database Schema Migration
-- Creates tables for real-time group chat with extraction
-- ============================================================

-- Chat Groups Table
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{"allowMediaUpload": true, "extractionEnabled": true, "maxMembers": 50}'::jsonb
);

-- Chat Members Table
CREATE TABLE IF NOT EXISTS chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  user_id UUID,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(10) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  media_url TEXT,
  media_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Chat Reactions Table
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES chat_members(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, member_id, emoji)
);

-- Chat Read Receipts Table
CREATE TABLE IF NOT EXISTS chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES chat_members(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, member_id)
);

-- Chat Extraction Snapshots Table
CREATE TABLE IF NOT EXISTS chat_extraction_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  extraction_data JSONB NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_by UUID REFERENCES chat_members(id) ON DELETE SET NULL,
  finalized_at TIMESTAMPTZ
);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_chat_groups_code ON chat_groups(code);
CREATE INDEX IF NOT EXISTS idx_chat_groups_active ON chat_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_chat_members_group ON chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_device ON chat_members(device_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_active ON chat_members(group_id, is_active);

CREATE INDEX IF NOT EXISTS idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_message ON chat_read_receipts(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_extraction_group ON chat_extraction_snapshots(group_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_extraction_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later based on auth)
CREATE POLICY "Allow all on chat_groups" ON chat_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_members" ON chat_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_reactions" ON chat_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_read_receipts" ON chat_read_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_extraction_snapshots" ON chat_extraction_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Enable Realtime for Chat Tables
-- ============================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;

-- ============================================================
-- Storage Bucket for Chat Media (run separately in Supabase dashboard)
-- ============================================================

-- Note: Storage buckets need to be created via the Supabase dashboard or API
-- Create a public bucket named 'chat-media' with the following settings:
-- - Public: true
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- - Max file size: 10MB
