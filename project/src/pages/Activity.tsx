import React, { useState, useEffect } from 'react'
import { Activity as ActivityIcon, CheckCircle, Clock, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'moderate' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  deadline: string
  created_at: string
  project?: {
    name: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  description: string
  priority: 'high' | 'moderate' | 'low'
  date: string
  deadline: string
  created_at: string
}

const Activity: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'completed' | 'current' | 'upcoming'>('current')

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchEvents()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to fetch tasks')
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
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

  const isUpcoming = (date: string) => {
    const taskDate = new Date(date)
    const now = new Date()
    const diffInDays = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diffInDays > 0 && diffInDays <= 7
  }

  const isOverdue = (date: string) => {
    const taskDate = new Date(date)
    const now = new Date()
    return taskDate < now
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Tomorrow'
    if (diffInDays === -1) return 'Yesterday'
    if (diffInDays > 1 && diffInDays <= 7) return `In ${diffInDays} days`
    if (diffInDays < -1 && diffInDays >= -7) return `${Math.abs(diffInDays)} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const completedTasks = tasks.filter(task => task.status === 'completed')
  const currentTasks = tasks.filter(task => task.status === 'in_progress')
  const upcomingTasks = tasks.filter(task => 
    task.status === 'pending' && isUpcoming(task.deadline)
  )
  const upcomingEvents = events.filter(event => isUpcoming(event.date))

  const getTabContent = () => {
    switch (activeTab) {
      case 'completed':
        return completedTasks
      case 'current':
        return currentTasks
      case 'upcoming':
        return [...upcomingTasks, ...upcomingEvents.map(event => ({
          ...event,
          status: 'pending' as const,
          deadline: event.date
        }))]
      default:
        return []
    }
  }

  const tabContent = getTabContent()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Activity
          </h1>
          <p className="text-gray-400 mt-2">Track your productivity and task completion</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Tasks</p>
              <p className="text-2xl font-bold text-blue-400">{currentTasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Upcoming</p>
              <p className="text-2xl font-bold text-violet-400">{upcomingTasks.length + upcomingEvents.length}</p>
            </div>
            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'current'
                ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Current ({currentTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming ({upcomingTasks.length + upcomingEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Completed ({completedTasks.length})</span>
          </button>
        </div>

        {/* Content */}
        {tabContent.length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No {activeTab} tasks
            </h3>
            <p className="text-gray-400">
              {activeTab === 'completed' && 'Complete some tasks to see them here'}
              {activeTab === 'current' && 'Start working on some tasks to see them here'}
              {activeTab === 'upcoming' && 'Schedule some tasks to see them here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tabContent.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  'status' in item && item.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'status' in item && isOverdue(item.deadline) && item.status !== 'completed'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-700/30 border-gray-600/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-medium text-white ${
                        'status' in item && item.status === 'completed' ? 'line-through opacity-75' : ''
                      }`}>
                        {item.title}
                      </h4>
                      {'project' in item && item.project && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {item.project.name}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-gray-400 text-sm mb-2 ${
                        'status' in item && item.status === 'completed' ? 'line-through opacity-75' : ''
                      }`}>
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-gray-400 ${
                          'status' in item && isOverdue(item.deadline) && item.status !== 'completed'
                            ? 'text-red-400 font-medium'
                            : ''
                        }`}>
                          {formatDate(item.deadline)}
                        </span>
                      </div>
                      {'status' in item && (
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Activity