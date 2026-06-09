-- Chat Sessions
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_sessions_user_id_idx ON chat_sessions(user_id);

-- Chat Messages
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb, -- Store references to documents
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_id_idx ON chat_messages(session_id);

-- RLS Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages"
  ON chat_messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
  ));

-- Updated_at trigger for sessions
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
