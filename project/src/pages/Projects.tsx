import React, { useState, useEffect } from 'react'
import { Plus, Users, MessageCircle, Calendar, Trash2, Edit, UserPlus, Send, X, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Project {
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

interface Friend {
  id: string
  username: string
  email: string
  avatar_url: string | null
}

interface ProjectTask {
  id: string
  title: string
  description: string
  priority: 'high' | 'moderate' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  deadline: string
  assigned_to: string
  project_id: string
  user_id: string
  created_at: string
}

interface TeamMember {
  id: string
  username: string
  email: string
  avatar_url: string | null
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: {
    username: string
    avatar_url: string | null
  }
}

const Projects: React.FC = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [projectMessages, setProjectMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'moderate' as const,
    deadline: '',
    selectedMembers: [] as string[],
  })
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'moderate' as const,
    deadline: '',
    assigned_to: '',
  })

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchFriends()
    }
  }, [user])

  useEffect(() => {
    if (selectedProject && showProjectDetail) {
      fetchProjectTasks()
      fetchTeamMembers()
      fetchProjectMessages()
    }
  }, [selectedProject, showProjectDetail])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`creator_id.eq.${user!.id},team_members.cs.{${user!.id}}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, email, avatar_url),
          requester:profiles!friendships_requester_id_fkey(id, username, email, avatar_url)
        `)
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .eq('status', 'accepted')

      if (error) throw error

      const friendsList = data?.map(friendship => {
        const friend = friendship.requester_id === user!.id 
          ? friendship.addressee 
          : friendship.requester
        return friend
      }) || []
      
      setFriends(friendsList)
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchProjectTasks = async () => {
    if (!selectedProject) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjectTasks(data || [])
    } catch (error) {
      console.error('Error fetching project tasks:', error)
    }
  }

  const fetchTeamMembers = async () => {
    if (!selectedProject || selectedProject.team_members.length === 0) {
      setTeamMembers([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .in('id', selectedProject.team_members)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchProjectMessages = async () => {
    if (!selectedProject) return

    try {
      // Get all team members including creator
      const allMembers = [selectedProject.creator_id, ...selectedProject.team_members]
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .in('sender_id', allMembers)
        .in('receiver_id', allMembers)
        .order('created_at', { ascending: true })

      if (error) throw error
      setProjectMessages(data || [])
    } catch (error) {
      console.error('Error fetching project messages:', error)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          priority: newProject.priority,
          deadline: newProject.deadline,
          creator_id: user!.id,
          team_members: newProject.selectedMembers,
          progress: 0,
        })
        .select()
        .single()

      if (error) throw error

      setProjects([data, ...projects])
      setNewProject({
        name: '',
        description: '',
        priority: 'moderate',
        deadline: '',
        selectedMembers: [],
      })
      setShowAddForm(false)
      toast.success('Project created successfully!')
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
        setShowProjectDetail(false)
      }
      toast.success('Project deleted successfully!')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !selectedProject) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          deadline: newTask.deadline,
          assigned_to: newTask.assigned_to,
          project_id: selectedProject.id,
          user_id: user!.id,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setProjectTasks([data, ...projectTasks])
      setNewTask({
        title: '',
        description: '',
        priority: 'moderate',
        deadline: '',
        assigned_to: '',
      })
      setShowTaskForm(false)
      toast.success('Task created successfully!')

      // Send notification to assigned user
      if (newTask.assigned_to !== user!.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: newTask.assigned_to,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${newTask.title}`,
            type: 'project',
          })
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const updateTaskStatus = async (taskId: string, status: ProjectTask['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

      if (error) throw error

      setProjectTasks(projectTasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      ))

      // Update project progress
      const completedTasks = projectTasks.filter(t => t.status === 'completed' || (t.id === taskId && status === 'completed')).length
      const totalTasks = projectTasks.length
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      await supabase
        .from('projects')
        .update({ progress: newProgress })
        .eq('id', selectedProject!.id)

      setSelectedProject(prev => prev ? { ...prev, progress: newProgress } : null)
      
      toast.success('Task updated!')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const sendProjectMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProject) return

    try {
      // Send message to all team members
      const allMembers = [selectedProject.creator_id, ...selectedProject.team_members]
      const receivers = allMembers.filter(id => id !== user!.id)

      for (const receiverId of receivers) {
        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: user!.id,
            receiver_id: receiverId,
            content: `[Project: ${selectedProject.name}] ${newMessage.trim()}`,
          })

        if (error) throw error
      }

      setNewMessage('')
      fetchProjectMessages()
      toast.success('Message sent to team!')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (showProjectDetail && selectedProject) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setShowProjectDetail(false)}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Projects</span>
        </button>

        {/* Project Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{selectedProject.name}</h1>
          <p className="text-gray-400 mb-4">{selectedProject.description}</p>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(selectedProject.priority)}`}>
                {selectedProject.priority}
              </span>
              <span className="text-gray-400 text-sm">
                Due: {new Date(selectedProject.deadline).toLocaleDateString()}
              </span>
            </div>
            <div className="w-full lg:w-48">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-gray-400">{selectedProject.progress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${selectedProject.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tasks Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold text-white">Project Tasks</h3>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Add Task Form */}
              {showTaskForm && (
                <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <form onSubmit={createTask} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Task title"
                        required
                      />
                      <input
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Task description"
                      rows={2}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="moderate">Moderate Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <select
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Assign to...</option>
                        <option value={user!.id}>Myself</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 text-sm"
                      >
                        Add Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTaskForm(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tasks List */}
              {projectTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectTasks.map(task => (
                    <div key={task.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 space-y-2 sm:space-y-0">
                        <h4 className="font-medium text-white text-sm">{task.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-gray-400 text-xs mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 space-y-2 sm:space-y-0">
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-2">
                          {task.status !== 'completed' && (
                            <>
                              {task.status === 'pending' && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                  className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>Start</span>
                                </button>
                              )}
                              {task.status === 'in_progress' && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'completed')}
                                  className="text-green-400 hover:text-green-300 flex items-center space-x-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Complete</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Team Management */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Management</h3>
              <div className="space-y-3">
                {/* Creator */}
                <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Project Creator</p>
                    <p className="text-blue-400 text-xs">Admin Role</p>
                  </div>
                </div>
                
                {/* Team Members */}
                {teamMembers.length === 0 ? (
                  <p className="text-gray-400 text-sm">No team members</p>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm">{member.username}</p>
                        <p className="text-gray-400 text-xs">Team Member</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project Chat */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Chat</h3>
              
              {/* Messages */}
              <div className="h-48 overflow-y-auto mb-4 space-y-2">
                {projectMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs">No messages yet</p>
                  </div>
                ) : (
                  projectMessages.map(message => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg text-xs ${
                        message.sender_id === user!.id
                          ? 'bg-blue-500/20 text-blue-400 ml-4'
                          : 'bg-gray-700/50 text-gray-300 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {message.sender?.username || 'Unknown'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p>{message.content.replace(/^\[Project: .*?\] /, '')}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={sendProjectMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-violet-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-gray-400 mt-2">Manage your projects and collaborate with teams</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Add Project Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
          <form onSubmit={createProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project description"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Members
                </label>
                <select
                  multiple
                  value={newProject.selectedMembers}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setNewProject({ ...newProject, selectedMembers: selected })
                  }}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {friends.map(friend => (
                    <option key={friend.id} value={friend.id}>
                      {friend.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple friends</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-violet-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200"
              >
                Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-full sm:w-auto bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400">Create your first project to get started</p>
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              onClick={() => {
                setSelectedProject(project)
                setShowProjectDetail(true)
              }}
              className="p-4 lg:p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                  {project.creator_id === user!.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      }}
                      className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-gray-400">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                  <span>{project.team_members.length + 1} members</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Projects