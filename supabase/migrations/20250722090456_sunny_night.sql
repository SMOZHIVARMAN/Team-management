/*
  # TaskManagement Application Schema v2

  - Automated profile creation via database trigger
  - Simplified `profiles` table (removed redundant email)
  - Strengthened RLS policies
*/

-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Users can read other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (without email)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text,
  skills text[] DEFAULT '{}',
  experience text,
  resume_url text,
  avatar_url text,
  linkedin text,
  github text,
  created_at timestamptz DEFAULT now()
);

-- Function to create a new profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to see other profiles (e.g., for friend discovery)
-- This can be further restricted based on your app's logic
CREATE POLICY "Authenticated users can view other profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Recreate other tables and policies as they were

-- Create custom types
CREATE TYPE priority_level AS ENUM ('high', 'moderate', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE notification_type AS ENUM ('friend_request', 'task_deadline', 'chat', 'project');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  priority priority_level DEFAULT 'moderate',
  deadline date NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_members uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  priority priority_level DEFAULT 'moderate',
  status task_status DEFAULT 'pending',
  deadline date NOT NULL,
  assigned_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK(requester_id != addressee_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK(sender_id != receiver_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  priority priority_level DEFAULT 'moderate',
  date date NOT NULL,
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for other tables (unchanged)

CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid() OR auth.uid() = ANY(team_members));

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create friendship requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update friendships they're part of"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can read their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_members ON projects USING GIN(team_members);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
