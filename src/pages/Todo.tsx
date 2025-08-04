import React, { useState, useEffect } from 'react'
import { Plus, Check, X, Calendar, Flag } from 'lucide-react'
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
}

const Todo: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'moderate' as const,
    deadline: '',
  })

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          deadline: newTask.deadline,
          user_id: user!.id,
          assigned_to: user!.id,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTask({
        title: '',
        description: '',
        priority: 'moderate',
        deadline: '',
      })
      setShowAddForm(false)
      toast.success('Task added successfully!')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      ))
      toast.success('Task updated!')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(task => task.id !== taskId))
      toast.success('Task deleted!')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
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

  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Todo List
          </h1>
          <p className="text-gray-400 mt-2">Manage your tasks and stay organized</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Task</h3>
          <form onSubmit={addTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-violet-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200"
              >
                Add Task
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

      {/* Task Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Pending Tasks */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Pending</h3>
            <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm">
              {pendingTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <div key={task.id} className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">In Progress</h3>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {inProgressTasks.map((task) => (
              <div key={task.id} className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Completed</h3>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <div key={task.id} className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 opacity-75">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-white line-through">{task.title}</h4>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {task.description && (
                  <p className="text-gray-400 text-sm mb-3 line-through">{task.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Todo