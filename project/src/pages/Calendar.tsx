import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface CalendarEvent {
  id: string
  title: string
  description: string
  priority: 'high' | 'moderate' | 'low'
  date: string
  deadline: string
  created_at: string
}

const Calendar: React.FC = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    priority: 'moderate' as const,
    deadline: '',
  })

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user, currentDate])

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    }
  }

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !newEvent.title.trim()) return

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEvent.title,
          description: newEvent.description,
          priority: newEvent.priority,
          date: selectedDate.toISOString().split('T')[0],
          deadline: newEvent.deadline,
          user_id: user!.id,
        })
        .select()
        .single()

      if (error) throw error

      setEvents([...events, data])
      setNewEvent({
        title: '',
        description: '',
        priority: 'moderate',
        deadline: '',
      })
      setShowAddForm(false)
      toast.success('Event added successfully!')
    } catch (error) {
      console.error('Error adding event:', error)
      toast.error('Failed to add event')
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ))
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
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

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const sortedSelectedDateEvents = selectedDateEvents.sort((a, b) => {
    const priorityOrder = { high: 3, moderate: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-gray-400 mt-2">Schedule and manage your tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 lg:p-3 text-xs lg:text-sm font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-3 h-24"></div>
                }

                const dayEvents = getEventsForDate(date)
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                const isToday = date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date)
                      setShowAddForm(false)
                    }}
                    className={`p-1 lg:p-2 h-16 lg:h-24 cursor-pointer rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : isToday
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-xs lg:text-sm font-medium ${
                        isToday ? 'text-violet-400' : 'text-white'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 lg:px-2 py-1 rounded truncate ${getPriorityColor(event.priority)}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-400 px-1 lg:px-2">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="space-y-4 lg:space-y-6">
          {selectedDate && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-violet-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {sortedSelectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No events scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSelectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{event.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(event.priority)}`}>
                          {event.priority}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-gray-400 text-xs mb-2">{event.description}</p>
                      )}
                      {event.deadline && (
                        <p className="text-gray-400 text-xs">
                          Deadline: {new Date(event.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Event Form */}
          {showAddForm && selectedDate && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add Event</h3>
              <form onSubmit={addEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Event description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newEvent.deadline}
                    onChange={(e) => setNewEvent({ ...newEvent, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 text-sm"
                  >
                    Add Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calendar