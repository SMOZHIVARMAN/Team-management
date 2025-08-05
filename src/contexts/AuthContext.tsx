import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  userProfile: any
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && session) {
        fetchUserProfile(session.user).finally(() => setLoading(false));
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && session) {
        fetchUserProfile(session.user).finally(() => setLoading(false));
      } else if (!session) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createProfile = async (currentUser: User) => {
    try {
      const username = currentUser.user_metadata?.username || `user-${currentUser.id.slice(0, 8)}`;
      const email = currentUser.email;

      if (!email) {
        toast.error('Could not initialize your profile: email is missing.');
        console.error('Error creating profile: email is null for user ' + currentUser.id);
        setUserProfile(null);
        return;
      }

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({ id: currentUser.id, username, email })
        .select()
        .single();
  
      if (error) {
        toast.error('Could not initialize your profile.');
        console.error('Error creating profile:', error);
        setUserProfile(null);
      } else {
        setUserProfile(newProfile);
        toast.success('Your profile has been set up!');
      }
    } catch (error) {
      console.error('Create profile exception:', error);
      setUserProfile(null);
    }
  };

  const fetchUserProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error && error.code === 'PGRST116') {
        console.warn('Profile not found, creating one...');
        await createProfile(currentUser);
      } else if (error) {
        console.error('Error fetching profile:', error)
        setUserProfile(null)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      setUserProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username
          }
        }
      })
      
      if (error) throw error

      toast.success('Account created successfully!')
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately
      setSession(null)
      setUser(null)
      setUserProfile(null)
      
      toast.success('Logged out successfully!')
    } catch (error: any) {
      console.error('Logout error:', error)
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    userProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}