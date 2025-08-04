import React, { useEffect, useState } from 'react'
import { Plus, Users, CheckSquare, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Project {
  id: string
  name: string
  progress: number
  deadline: string
  priority: 'high' | 'moderate' | 'low'
}

interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'moderate' | 'low'
}

interface Friend {
  id: string
  username: string
  avatar_url: string | null
}

const Dashboard: React.FC = () => {
  const { user, userProfile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch user's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', user!.id)
        .limit(4)

      // Fetch user's tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .limit(5)

      // Fetch friends
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url),
          requester:profiles!friendships_requester_id_fkey(id, username, avatar_url)
        `)
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .eq('status', 'accepted')
        .limit(6)

      setProjects(projectsData || [])
      setTasks(tasksData || [])
      
      // Process friends data
      const friendsList = friendsData?.map(friendship => {
        const friend = friendship.requester_id === user!.id 
          ? friendship.addressee 
          : friendship.requester
        return friend
      }) || []
      
      setFriends(friendsList)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Welcome back, {userProfile?.username || 'User'}!
          </h1>
          <p className="text-gray-400 mt-2">Here's what's happening with your tasks today.</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Tasks</p>
              <p className="text-2xl font-bold text-white">
                {tasks.filter(t => t.status !== 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-2xl font-bold text-white">{friends.length}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm">View all</button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No projects yet</p>
                <p className="text-gray-500 text-sm">Create your first project to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex-1 bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-violet-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">{project.progress}%</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 lg:space-y-6">
          {/* Quick Todo */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Todo</h3>
            {tasks.slice(0, 3).length === 0 ? (
              <div className="text-center py-6">
                <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <p className={`text-sm ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
            {friends.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No friends yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.slice(0, 4).map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-white text-xs font-medium">
                          {friend.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{friend.username}</p>
                      <div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></div>
                      <span className="text-xs text-gray-400">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard