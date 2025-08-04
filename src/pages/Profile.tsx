import React, { useState, useEffect } from 'react'
import { User, Mail, Github, Linkedin, Upload, Edit, Save, X, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Profile {
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
}

const Profile: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    experience: '',
    linkedin: '',
    github: '',
    skills: [] as string[]
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      
      setProfile(data)
      setEditForm({
        username: data.username || '',
        bio: data.bio || '',
        experience: data.experience || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        skills: data.skills || []
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio,
          experience: editForm.experience,
          linkedin: editForm.linkedin,
          github: editForm.github,
          skills: editForm.skills
        })
        .eq('id', user!.id)

      if (error) throw error

      await fetchProfile()
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        bio: profile.bio || '',
        experience: profile.experience || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        skills: profile.skills || []
      })
    }
    setEditing(false)
  }

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(skill => skill !== skillToRemove)
    })
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user!.id)

      if (updateError) throw updateError

      await fetchProfile()
      await refreshProfile()
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    }
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    try {
      const fileName = `${user!.id}-resume-${Date.now()}.pdf`
      const filePath = `resumes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: data.publicUrl })
        .eq('id', user!.id)

      if (updateError) throw updateError

      await fetchProfile()
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Profile not found</h3>
        <p className="text-gray-400">Unable to load profile information</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-400 mt-2">Manage your profile and account settings</p>
        </div>
        <div className="flex items-center space-x-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            {/* Avatar */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <label className="absolute bottom-4 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-semibold text-white">{profile.username}</h2>
              <p className="text-gray-400">{profile.email}</p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">{profile.email}</span>
              </div>
              {profile.linkedin && (
                <div className="flex items-center space-x-3">
                  <Linkedin className="w-5 h-5 text-blue-400" />
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {profile.github && (
                <div className="flex items-center space-x-3">
                  <Github className="w-5 h-5 text-gray-400" />
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    GitHub Profile
                  </a>
                </div>
              )}
            </div>

            {/* Resume */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Resume</h3>
              {profile.resume_url ? (
                <div className="flex items-center justify-between">
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Resume</span>
                  </a>
                  <label className="bg-gray-600 text-white px-3 py-1 rounded text-sm cursor-pointer hover:bg-gray-700 transition-colors">
                    Update
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white py-2 px-4 rounded-lg cursor-pointer hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center justify-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Resume</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Bio</h3>
            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <p className="text-gray-300">
                {profile.bio || 'No bio added yet. Click edit to add your bio.'}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
            {editing ? (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a skill..."
                  />
                  <button
                    onClick={addSkill}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.skills.map(skill => (
                    <span
                      key={skill}
                      className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-blue-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map(skill => (
                    <span
                      key={skill}
                      className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No skills added yet. Click edit to add your skills.</p>
                )}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Experience</h3>
            {editing ? (
              <textarea
                value={editForm.experience}
                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your work experience..."
                rows={6}
              />
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap">
                {profile.experience || 'No experience added yet. Click edit to add your experience.'}
              </p>
            )}
          </div>

          {/* Social Links Edit */}
          {editing && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={editForm.github}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile