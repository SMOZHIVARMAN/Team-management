import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ovakczhzsjpmctiomzra.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YWtjemh6c2pwbWN0aW9tenJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDI2NzQsImV4cCI6MjA1MzExODY3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          bio: string | null
          skills: string[] | null
          experience: string | null
          resume_url: string | null
          avatar_url: string | null
          linkedin: string | null
          github: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          bio?: string | null
          skills?: string[] | null
          experience?: string | null
          resume_url?: string | null
          avatar_url?: string | null
          linkedin?: string | null
          github?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          bio?: string | null
          skills?: string[] | null
          experience?: string | null
          resume_url?: string | null
          avatar_url?: string | null
          linkedin?: string | null
          github?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          deadline: string
          progress: number
          creator_id: string
          team_members: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          deadline: string
          progress?: number
          creator_id: string
          team_members?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          priority?: 'high' | 'moderate' | 'low'
          deadline?: string
          progress?: number
          creator_id?: string
          team_members?: string[]
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          status: 'pending' | 'in_progress' | 'completed'
          deadline: string
          assigned_to: string
          project_id: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          status?: 'pending' | 'in_progress' | 'completed'
          deadline: string
          assigned_to: string
          project_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'high' | 'moderate' | 'low'
          status?: 'pending' | 'in_progress' | 'completed'
          deadline?: string
          assigned_to?: string
          project_id?: string | null
          user_id?: string
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'friend_request' | 'task_deadline' | 'chat' | 'project'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'friend_request' | 'task_deadline' | 'chat' | 'project'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'friend_request' | 'task_deadline' | 'chat' | 'project'
          read?: boolean
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          date: string
          deadline: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          priority: 'high' | 'moderate' | 'low'
          date: string
          deadline: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          priority?: 'high' | 'moderate' | 'low'
          date?: string
          deadline?: string
          created_at?: string
        }
      }
    }
  }
}